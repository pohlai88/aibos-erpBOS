/**
 * API Security Script
 * 
 * Comprehensive API security hardening for file upload routes with integrated guard injection.
 * Consolidates all API security features into a single, idempotent solution.
 * 
 * Features:
 * - File upload pattern detection and transformation
 * - Centralized import management and response standardization
 * - Runtime configuration for Node.js compatibility
 * - Rate limiting injection (--limit flag)
 * - Attempt auditing injection (--audit-attempt flag)
 * - Security guard placement and validation
 * 
 * Usage:
 *   pnpm api:security [--dry] [--verbose] [--force] [--limit] [--audit-attempt] [--target=path]
 * 
 * Examples:
 *   # Preview security changes
 *   pnpm api:security:verbose --limit --audit-attempt
 *   
 *   # Apply full security hardening
 *   pnpm api:security:full
 *   
 *   # Target specific directory
 *   pnpm api:security --target=apps/bff/app/api/bank --limit
 */

const fs = require('node:fs');
const path = require('node:path');

const API_DIR = path.resolve('apps/bff/app/api');
const KIT_MODULE = process.env.API_KIT_ALIAS || '@/api/_kit';
const RATE_MODULE = process.env.API_RATE_ALIAS || '@/api/_kit/rate';
const AUDIT_MODULE = process.env.API_AUDIT_ALIAS || '@/api/_kit/audit';

// Policy gating support
let POLICY = null;
const pArg = process.argv.find(a => a.startsWith('--policy='));
if (pArg) {
    try {
        POLICY = JSON.parse(fs.readFileSync(pArg.split('=')[1], 'utf8'));
    } catch (error) {
        console.error('❌ Failed to load policy file:', error.message);
        process.exit(1);
    }
}

/**
 * Check if file matches policy rules
 */
function inPolicy(filePath) {
    if (!POLICY) return true;

    // Simple glob matching (avoiding minimatch dependency for now)
    const relativePath = path.relative(API_DIR, filePath).replace(/\\/g, '/');

    const include = POLICY.include || [];
    const exclude = POLICY.exclude || [];

    const matchesInclude = include.length === 0 || include.some(pattern =>
        relativePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''))
    );

    const matchesExclude = exclude.some(pattern =>
        relativePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''))
    );

    return matchesInclude && !matchesExclude;
}

// CLI flags
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry') || args.has('-n');
const FORCE = args.has('--force');
const VERBOSE = args.has('--verbose') || args.has('-v');
const INJECT_LIMIT = args.has('--limit');
const INJECT_AUDIT_ATTEMPT = args.has('--audit-attempt');
const INJECT_WRAP = args.has('--wrap');

// Target directory (default to full API dir, but can be overridden)
let TARGET_DIR = API_DIR;
const targetArg = process.argv.find(arg => arg.startsWith('--target='));
if (targetArg) {
    TARGET_DIR = path.resolve(targetArg.split('=')[1]);
}

// Stats tracking
let updatedCount = 0, skippedCount = 0, errorCount = 0, totalScanned = 0, skippedRisky = 0, metaOnly = 0;

/**
 * Check if route has proper wrapper (withRouteErrors)
 */
function hasWrapper(content) {
    return /withRouteErrors\(/.test(content);
}

/**
 * Check if route is marked as nonstandard
 */
function isNonstandard(content) {
    return /@api:nonstandard/.test(content);
}

/**
 * Advanced file upload route detection with multiple patterns
 */
function isFileUploadRoute(content) {
    const patterns = [
        // Direct file handling
        /formData\.get\(['"]file['"]\)/,
        /formData\.get\(['"]csv['"]\)/,
        /formData\.get\(['"]upload['"]\)/,
        /formData\.get\(['"]data['"]\)/,
        /formData\.get\(['"]import['"]\)/,

        // FormData usage
        /\.formData\(\)/,
        /multipart\/form-data/,
        /FormData/,

        // File operations
        /file\.text\(\)/,
        /file\.stream\(\)/,
        /file\.size/,
        /file\.name/,
        /File\s*\)/,

        // Import service patterns
        /import.*import.*Data/,
        /import.*upload/,
        /import.*csv/,
        /import.*file/,

        // Service method patterns
        /importIntangiblePlans/,
        /importDriverData/,
        /importBankData/,
        /importBankFile/,
        /importCsv/,
        /uploadFile/,
        /processFile/,

        // Response patterns indicating file processing
        /imported.*count/,
        /errors.*warnings/,
        /success.*import/,
        /file.*imported/
    ];

    const matches = patterns.filter(pattern => pattern.test(content));
    return matches.length >= 2; // Require at least 2 patterns for confidence
}

/**
 * Detect specific file upload patterns for targeted transformation
 */
function detectUploadPattern(content) {
    if (/formData\.get\(['"]file['"]\)/.test(content) && /JSON\.parse\(formData\.get\(['"]mapping['"]\)/.test(content)) {
        return 'multipart-with-mapping';
    }
    if (/await\s+req\.json\(\)/.test(content) && /BankFileImport\.parse/.test(content)) {
        return 'json-import';
    }
    if (/formData\.get\(['"]csv['"]\)/.test(content)) {
        return 'csv-direct';
    }
    if (/file\.stream\(\)/.test(content)) {
        return 'streaming';
    }
    return 'generic';
}

/**
 * Check hardening status with detailed analysis
 */
function analyzeHardeningStatus(content) {
    const status = {
        hasRuntime: /export\s+const\s+runtime\s*=\s*["']nodejs["']/.test(content),
        hasFileUploadResponse: /fileUploadResponse\(/.test(content),
        hasValidateFileUpload: /validateFileUpload\(/.test(content),
        hasWithRouteErrors: /withRouteErrors\(/.test(content),
        hasCentralizedImports: /from\s*["']@\/api\/_lib\/http["']/.test(content),
        hasFileUploadImports: /from\s*["']@\/api\/_lib\/file-upload["']/.test(content),
        usesResponseJson: /Response\.json\(/.test(content),
        usesNextResponseJson: /NextResponse\.json\(/.test(content),
        hasCustomHeaders: /headers:\s*\{/.test(content),
        hasErrorHandling: /catch\s*\(/.test(content)
    };

    status.isFullyHardened = status.hasRuntime && status.hasFileUploadResponse && status.hasValidateFileUpload;
    status.needsStandardization = !status.hasWithRouteErrors;
    status.needsHardening = !status.isFullyHardened && status.hasWithRouteErrors;

    return status;
}

/**
 * Insert new import lines after the last existing import at the **top** of the file.
 * If no imports exist, insert at file start. Handles multi-line imports.
 */
function insertImportsAtTop(content, importLines) {
    if (!importLines || importLines.length === 0) return content;

    // Split content into lines for easier manipulation
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find the end of existing imports
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ') && line.endsWith(';')) {
            insertIndex = i + 1;
        } else if (line === '' && insertIndex > 0) {
            // Skip empty lines after imports
            continue;
        } else if (insertIndex > 0 && !line.startsWith('import ')) {
            break;
        }
    }

    // Insert new imports at the correct position
    const beforeImports = lines.slice(0, insertIndex);
    const afterImports = lines.slice(insertIndex);

    // Combine: existing imports + new imports + rest of content
    const result = [
        ...beforeImports,
        ...importLines,
        ...afterImports
    ].join('\n');

    return result;
}

/**
 * Smart import management with conflict resolution (dedup + top placement)
 */
function manageImports(content) {
    let updated = content;

    // Extract existing imports
    const imports = {
        http: [],
        fileUpload: [],
        kit: [],
        rate: [],
        audit: [],
        other: []
    };

    const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const [, namedImports, module] = match;
        const importsList = namedImports.split(',').map(s => s.trim()).filter(Boolean);

        if (module === '@/api/_lib/http') {
            imports.http = importsList;
        } else if (module === '@/api/_lib/file-upload') {
            imports.fileUpload = importsList;
        } else if (module === KIT_MODULE) {
            imports.kit = importsList;
        } else if (module === RATE_MODULE) {
            imports.rate = importsList;
        } else if (module === AUDIT_MODULE) {
            imports.audit = importsList;
        } else {
            imports.other.push({ module, imports: importsList });
        }
    }

    // Determine what we need to add
    const needsFileUploadResponse = !imports.http.includes('fileUploadResponse');
    const needsValidateFileUpload = !imports.fileUpload.includes('validateFileUpload');
    const needsServerError = !imports.http.includes('serverError');
    const needsTooMany = INJECT_LIMIT && !imports.kit.includes('tooManyRequests');
    const needsRate = INJECT_LIMIT && !imports.rate.includes('rateLimit');
    const needsAuditAttempt = INJECT_AUDIT_ATTEMPT && !imports.audit.includes('logAuditAttempt');
    const needsWithRouteErrors = INJECT_WRAP &&
        /withRouteErrors\(/.test(updated) &&
        !imports.kit.includes('withRouteErrors');

    // Build new import statements
    const newImports = [];

    // Update http imports
    if (needsFileUploadResponse || needsServerError) {
        const httpImports = Array.from(new Set([...imports.http]));
        if (needsFileUploadResponse) httpImports.push('fileUploadResponse');
        if (needsServerError) httpImports.push('serverError');
        newImports.push(`import { ${Array.from(new Set(httpImports)).join(', ')} } from "@/api/_lib/http";`);
    }

    // Add file-upload imports
    if (needsValidateFileUpload) {
        newImports.push(`import { validateFileUpload } from "@/api/_lib/file-upload";`);
    }

    // Guards imports (rate limit + tooManyRequests)
    if (INJECT_LIMIT) {
        if (needsRate) newImports.push(`import { rateLimit } from "${RATE_MODULE}";`);
        if (needsTooMany) {
            if (!imports.kit.length) {
                newImports.push(`import { tooManyRequests } from "${KIT_MODULE}";`);
            } else if (!imports.kit.includes('tooManyRequests')) {
                // Upgrade existing KIT import inline with deduplication
                updated = updated.replace(
                    new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*["']${KIT_MODULE}["']`),
                    (_m, g1) => {
                        const set = new Set(g1.split(',').map(s => s.trim()).filter(Boolean));
                        set.add('tooManyRequests');
                        return `import { ${[...set].join(', ')} } from "${KIT_MODULE}"`;
                    }
                );
            }
        }
    }

    // Attempt-audit import
    if (INJECT_AUDIT_ATTEMPT && needsAuditAttempt) {
        newImports.push(`import { logAuditAttempt } from "${AUDIT_MODULE}";`);
    }

    // withRouteErrors import (for --wrap)
    if (needsWithRouteErrors) {
        newImports.push(`import { withRouteErrors } from "${KIT_MODULE}";`);
    }

    // Insert new imports after existing imports
    if (newImports.length > 0) {
        updated = insertImportsAtTop(updated, newImports);
    }

    return updated;
}

/**
 * Advanced pattern matching and replacement for different upload types
 */
function transformUploadPattern(content, pattern) {
    let updated = content;

    switch (pattern) {
        case 'multipart-with-mapping':
            // Pattern: formData.get('file') + JSON.parse(formData.get('mapping'))
            const multipartPattern = /const\s+formData\s*=\s*await\s+req\.formData\(\);\s*\n\s*const\s+file\s*=\s*formData\.get\(['"]file['"]\)\s+as\s+File;\s*\n\s*const\s+mapping\s*=\s*JSON\.parse\(formData\.get\(['"]mapping['"]\)\s+as\s+string\);\s*\n\s*const\s+(\w+)\s*=\s*formData\.get\(['"](\w+)['"]\)\s+as\s+string;\s*\n\s*if\s*\(\s*!file\s*\)\s*\{\s*\n\s*return\s+Response\.json\(\{\s*error:\s*['"]No\s+file\s+provided['"]\s*\},\s*\{\s*status:\s*400\s*\}\);\s*\n\s*\}/;

            if (multipartPattern.test(updated)) {
                const match = updated.match(multipartPattern);
                if (match) {
                    const [, paramName, paramValue] = match;
                    const requiredFields = ['mapping', paramValue].filter(field => field !== 'undefined');

                    const replacement = `// Use centralized file upload validation
        const validation = await validateFileUpload(req, [${requiredFields.map(f => `'${f}'`).join(', ')}]);
        if (validation.error) return validation.error;

        const { file, data } = validation;
        const mapping = JSON.parse(data.mapping as string);
        const ${paramName} = data.${paramValue} as string;`;

                    updated = updated.replace(multipartPattern, replacement);
                }
            } else {
                // Fallback: simpler pattern without the third parameter
                const simpleMultipartPattern = /const\s+formData\s*=\s*await\s+req\.formData\(\);\s*[\r\n\s]*const\s+file\s*=\s*formData\.get\(['"]file['"]\)\s+as\s+File;\s*[\r\n\s]*const\s+mapping\s*=\s*JSON\.parse\(formData\.get\(['"]mapping['"]\)\s+as\s+string\);\s*[\r\n\s]*if\s*\(\s*!file\s*\)\s*\{\s*[\r\n\s]*return\s+Response\.json\(\{\s*error:\s*['"]No\s+file\s+provided['"]\s*\},\s*\{\s*status:\s*400\s*\}\);\s*[\r\n\s]*\}/;

                if (simpleMultipartPattern.test(updated)) {
                    const replacement = `// Use centralized file upload validation
        const validation = await validateFileUpload(req, ['mapping']);
        if (validation.error) return validation.error;

        const { file, data } = validation;
        const mapping = JSON.parse(data.mapping as string);`;

                    updated = updated.replace(simpleMultipartPattern, replacement);
                }
            }
            break;

        case 'json-import':
            // Pattern: req.json() + schema parsing
            const jsonPattern = /const\s+json\s*=\s*await\s+req\.json\(\);\s*\n\s*const\s+data\s*=\s*(\w+)\.parse\(json\);/;

            if (jsonPattern.test(updated)) {
                const replacement = `const json = await req.json();
        const data = $1.parse(json);`;
                updated = updated.replace(jsonPattern, replacement);
            }
            break;

        case 'csv-direct':
            // Pattern: direct CSV file handling
            const csvPattern = /const\s+csvFile\s*=\s*formData\.get\(['"]csv['"]\)\s+as\s+File;/;

            if (csvPattern.test(updated)) {
                const replacement = `const validation = await validateFileUpload(req, []);
        if (validation.error) return validation.error;
        const csvFile = validation.file;`;
                updated = updated.replace(csvPattern, replacement);
            }
            break;
    }

    return updated;
}

/**
 * Convert response patterns to centralized helpers
 */
function convertResponsePatterns(content) {
    let updated = content;

    // Convert success responses with result/message pattern
    const successPattern = /return\s+Response\.json\(\{\s*result,\s*message:\s*result\.success\s*\?\s*['"'][^'"]*['"]\s*:\s*['"'][^'"]*['"]\s*\},\s*\{\s*status:\s*result\.success\s*\?\s*200\s*:\s*400,\s*headers:\s*\{\s*['"]Access-Control-Allow-Origin['"]:\s*['"]\*['"]\s*\}\s*\}\);/;

    if (successPattern.test(updated)) {
        const replacement = `// Use centralized file upload response
        return fileUploadResponse(result, {
          headers: { 'Access-Control-Allow-Origin': '*' }
        });`;
        updated = updated.replace(successPattern, replacement);
    }

    // Convert error responses
    const errorPatterns = [
        /return\s+Response\.json\(\{\s*error:\s*['"'][^'"]*['"]\s*\},\s*\{\s*status:\s*400\s*\}\);/g,
        /return\s+Response\.json\(\{\s*error:\s*['"'][^'"]*['"]\s*\},\s*\{\s*status:\s*500\s*\}\);/g,
        /return\s+NextResponse\.json\(\{\s*error:\s*['"'][^'"]*['"]\s*\},\s*\{\s*status:\s*400\s*\}\);/g,
        /return\s+NextResponse\.json\(\{\s*error:\s*['"']Failed[^'"]*['"]\s*\},\s*\{\s*status:\s*500\s*\}\);/g
    ];

    errorPatterns.forEach(pattern => {
        updated = updated.replace(pattern, 'return serverError("Failed to process file upload");');
    });

    // Generic success normalizer (plain ok json) → leave to route unless CORS headers present; we only standardize when headers/custom present

    return updated;
}

/**
 * Inject a single guards block (rate limit + attempt audit) after capability check.
 * Idempotent: only inserts if no existing rateLimit() or logAuditAttempt() calls found.
 */
function injectGuards(content, options = {}) {
    const injectLimit = options.injectLimit ?? INJECT_LIMIT;
    const injectAuditAttempt = options.injectAuditAttempt ?? INJECT_AUDIT_ATTEMPT;
    const verbose = options.verbose ?? VERBOSE;

    if (!injectLimit && !injectAuditAttempt) {
        if (verbose) console.log('   ⏭️  No guard flags set');
        return content;
    }
    if (/(rateLimit\()|(logAuditAttempt\()/.test(content)) {
        if (verbose) console.log('   ⏭️  Guards already present');
        return content; // already present
    }

    // Find the canonical placement: right after capability check short-circuit
    // More flexible pattern to handle different variable names and formats
    const capCheckPattern = /(const\s+([A-Za-z_$][\w$]*)\s*=\s*requireCapability\([^;]*\);\s*[\r\n]+)(?:\s*if\s*\(\s*\2\s+instanceof\s+Response\s*\)\s*return\s*\2\s*;?|(?:\s*if\s*\(\s*isResponse\(\s*\2\s*\)\s*\)\s*return\s*\2\s*;?))[\r\n]+/;

    if (!capCheckPattern.test(content)) {
        if (verbose) {
            console.log('   ⏭️  No capability check pattern found for guard injection');
            console.log('   🔍 Pattern:', capCheckPattern.toString());
            console.log('   📝 Content snippet:', content.substring(0, 200) + '...');
        }
        return content; // no safe anchor; skip
    }

    if (verbose) console.log('   ✅ Capability check pattern found, injecting guards');

    const guardLines = [];
    if (injectLimit) {
        // Parse pragma to customize limit/window if present
        let limit = 5, windowMs = 60_000;
        const pragma = content.match(/@guard:limit\s+(\d+)\s*\/\s*(\d+)/);
        if (pragma) { limit = +pragma[1]; windowMs = +pragma[2]; }

        guardLines.push(
            `  // Rate limit file-upload attempts (company:user scope)
  {
    const rl = await rateLimit({
      key: \`upload:\${auth.company_id}:\${auth.user_id}\`,
      limit: ${limit},
      windowMs: ${windowMs}
    });
    if (!rl.ok) return tooManyRequests("Please retry later");
  }`
        );
    }
    if (injectAuditAttempt) {
        guardLines.push(
            `  // Route-level attempt audit (service emits post-commit audit on success)
  try {
    // best-effort; do not block route on audit failure
    // \`file\` may not be resolved yet; we emit size later if available (secondary call below if desired)
    logAuditAttempt({
      action: "import_attempt",
      module: "file_upload",
      companyId: auth.company_id,
      actorId: auth.user_id,
      at: Date.now()
    });
  } catch {}`
        );
    }

    const injection = `$1${guardLines.join('\n')}\n`;
    let updated = content.replace(capCheckPattern, injection);

    // Alternative: inject audit after validation destructure if capability check failed
    if (INJECT_AUDIT_ATTEMPT && !/logAuditAttempt\(/.test(updated)) {
        const altFilePattern = /(const\s*\{\s*file\b[^=]*=\s*validation\s*;[^\n]*\n)/;
        if (altFilePattern.test(updated)) {
            const auditInjection = `$1  // Route-level attempt audit
  try {
    logAuditAttempt({
      action: "import_attempt",
      module: "file_upload",
      companyId: auth.company_id,
      actorId: auth.user_id,
      size: (file && typeof file === "object" && "size" in file) ? (file.size as number) : undefined,
      at: Date.now()
    });
  } catch {}
`;
            updated = updated.replace(altFilePattern, auditInjection);
        }
    }

    return updated;
}

/**
 * Add runtime export with smart placement
 */
function addRuntimeExport(content) {
    if (/export\s+const\s+runtime\s*=\s*["']nodejs["']/.test(content)) {
        return content; // Already has it
    }

    // Find the best insertion point
    const importMatch = content.match(/^import.*?;$/m);
    if (importMatch) {
        const insertPoint = importMatch.index + importMatch[0].length;
        return content.slice(0, insertPoint) +
            '\n\n// Explicitly run on Node for predictable File/stream behavior on large CSVs\nexport const runtime = "nodejs";\n' +
            content.slice(insertPoint);
    }

    // Fallback: add at the beginning
    return '// Explicitly run on Node for predictable File/stream behavior on large CSVs\nexport const runtime = "nodejs";\n\n' + content;
}

/**
 * Wrap route handlers with withRouteErrors if missing (opt-in via --wrap).
 * Simple patterns for GET/POST/PUT/PATCH/DELETE exported const handlers.
 */
function injectWrapper(content) {
    if (!INJECT_WRAP || hasWrapper(content)) return content;
    // Only touch files that export const METHOD = async (...) => { ... }
    // Convert to export const METHOD = withRouteErrors(async (...) => { ... })
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    let updated = content;
    for (const m of methods) {
        const pattern = new RegExp(`export\\s+const\\s+${m}\\s*=\\s*async\\s*\\(`);
        if (pattern.test(updated)) {
            updated = updated.replace(pattern, `export const ${m} = withRouteErrors(async (`);
        }
    }
    return updated;
}

/**
 * Process a single file with comprehensive analysis
 */
function processFile(filePath) {
    try {
        totalScanned++;
        const content = fs.readFileSync(filePath, 'utf8');

        // Detect and preserve line endings
        const hasCRLF = content.includes('\r\n');
        const lineEnding = hasCRLF ? '\r\n' : '\n';

        // Policy check
        if (!inPolicy(filePath)) {
            if (VERBOSE) console.log(`   ⏭️  File excluded by policy, skipping`);
            skippedCount++;
            return;
        }

        // SAFE MODE: skip risky files unless --force (inspired by fix-api-patterns.js)
        if (!FORCE) {
            const risky = content.includes("new Response(") ||
                content.includes("ReadableStream") ||
                content.includes("NextResponse.redirect") ||
                content.includes("Stream") ||
                content.includes("Blob") ||
                content.includes("ArrayBuffer");

            if (risky) {
                console.log(`⏭️  Skipping risky file (use --force to include): ${filePath}`);
                skippedRisky++;
                return;
            }
        }

        // Skip meta-only files (inspired by fix-api-patterns.js)
        const onlyMeta = /\bexport\s+const\s+(runtime|preferredRegion|dynamic|revalidate)\b/.test(content)
            && !/\bexport\s+(async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\b/.test(content);
        if (onlyMeta) {
            console.log(`⏭️  Meta-only route file, skipping: ${filePath}`);
            metaOnly++;
            return;
        }

        // Skip explicit nonstandard unless --force
        if (isNonstandard(content) && !FORCE) {
            if (VERBOSE) console.log('   ⏭️  @api:nonstandard, skipping (use --force to override)');
            skippedCount++; return;
        }

        // Analyze the file
        const isUpload = isFileUploadRoute(content);
        const pattern = detectUploadPattern(content);
        const status = analyzeHardeningStatus(content);

        if (VERBOSE) {
            console.log(`\n📄 Analyzing: ${filePath}`);
            console.log(`   Upload Route: ${isUpload}`);
            console.log(`   Pattern: ${pattern}`);
            console.log(`   Status:`, status);
        }

        // Skip if not a file upload route
        if (!isUpload) {
            if (VERBOSE) console.log('   ⏭️  Not a file upload route, skipping');
            skippedCount++;
            return;
        }

        // Optionally ensure wrapper unless --force
        if (!hasWrapper(content) && !FORCE && !INJECT_WRAP) {
            if (VERBOSE) console.log('   ⏭️  Not standardized (withRouteErrors). Use --wrap or --force.');
            skippedCount++; return;
        }

        // Skip if already fully hardened
        if (status.isFullyHardened) {
            if (VERBOSE) console.log('   ⏭️  Already fully hardened, skipping');
            skippedCount++;
            return;
        }

        let updated = content;
        let hasChanges = false;

        // 1) Optional wrapper (before any injections)
        const beforeWrap = updated;
        updated = injectWrapper(updated);
        if (updated !== beforeWrap) hasChanges = true;

        // 2) Runtime
        if (!status.hasRuntime) {
            updated = addRuntimeExport(updated);
            hasChanges = true;
        }

        // 3) Transform code first (so we know which imports we need)
        if (!status.hasValidateFileUpload) {
            const beforePattern = updated;
            updated = transformUploadPattern(updated, pattern);
            if (updated !== beforePattern) hasChanges = true;
        }
        if (!status.hasFileUploadResponse || status.usesResponseJson || status.usesNextResponseJson) {
            const beforeResponse = updated;
            updated = convertResponsePatterns(updated);
            if (updated !== beforeResponse) hasChanges = true;
        }
        // 4) Guards (after cap check)
        const beforeGuards = updated;
        updated = injectGuards(updated);
        if (updated !== beforeGuards) hasChanges = true;
        // 5) Imports (after we know what symbols we inserted)
        const beforeImports = updated;
        updated = manageImports(updated);
        if (updated !== beforeImports) hasChanges = true;

        if (hasChanges) {
            if (!DRY_RUN) {
                // Normalize line endings before writing
                const normalizedContent = updated.replace(/\r?\n/g, lineEnding);
                fs.writeFileSync(filePath, normalizedContent, 'utf8');
            }
            console.log(DRY_RUN ? '🧪 Would harden:' : '✅ Hardened:', filePath);
            if (VERBOSE) console.log(`   Pattern: ${pattern}, Changes: ${hasChanges}`);
            updatedCount++;
        } else {
            if (VERBOSE) console.log('   ⏭️  No changes needed');
            skippedCount++;
        }

    } catch (error) {
        console.error('❌ Error processing:', filePath, error.message);
        errorCount++;
    }
}

/**
 * Walk directory tree with progress tracking
 */
function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(p);
        } else if (entry.isFile() && entry.name === 'route.ts') {
            processFile(p);
        }
    }
}

// Main execution
console.log('🛡️  Starting API security hardening...');
console.log('📁 Scanning:', TARGET_DIR);
if (DRY_RUN) console.log('🧪 DRY RUN MODE - No files will be modified');
if (VERBOSE) console.log('🔍 VERBOSE MODE - Detailed analysis enabled');
if (!FORCE) console.log('🛡️  Safe mode ON - will skip non-standardized routes');
if (INJECT_LIMIT) console.log('⏲️  Rate limit injection ENABLED');
if (INJECT_AUDIT_ATTEMPT) console.log('📝 Attempt-audit injection ENABLED');
if (INJECT_WRAP) console.log('🧰 Wrapper injection ENABLED');

const startTime = Date.now();
walk(TARGET_DIR);
const endTime = Date.now();

console.log('\n' + '='.repeat(60));
console.log(DRY_RUN ? '🧪 Dry run completed.' : '✅ API security hardening completed!');
console.log(`⏱️  Execution time: ${endTime - startTime}ms`);
console.log(`📊 Summary: updated=${updatedCount} skipped=${skippedCount} skipped_risky=${skippedRisky} meta_only=${metaOnly} errors=${errorCount} total_scanned=${totalScanned}`);
console.log('💡 Run \'pnpm api:wrap:check\' to verify all routes are properly wrapped');
console.log('💡 Run \'pnpm api:security:verbose\' for detailed analysis');
console.log('💡 Use --limit and --audit-attempt flags to inject security guards');

// Exit codes for CI
process.on('exit', () => {
    if (errorCount > 0) {
        process.exitCode = 1; // Errors occurred
    } else if (DRY_RUN && updatedCount > 0) {
        process.exitCode = 2; // Dry run found diffs
    }
});

// --- test export shim (no-op in normal runs) ---
if (process.env.EXPORT_API_SECURITY_HELPERS === '1') {
    module.exports = {
        // pure helpers worth testing
        isFileUploadRoute,
        detectUploadPattern,
        analyzeHardeningStatus,
        manageImports,
        transformUploadPattern,
        convertResponsePatterns,
        injectGuards,
        addRuntimeExport,
        hasWrapper,
        isNonstandard,
        inPolicy,
    };
}
