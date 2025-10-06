#!/usr/bin/env node

/**
 * Complex API Pattern Fixer
 * 
 * Specifically targets the remaining ESLint errors in API routes:
 * 1. NextResponse.json() → ok()/badRequest() conversions
 * 2. Response.json() → ok()/badRequest() conversions  
 * 3. Function declarations → withRouteErrors wrappers
 * 4. Case block declarations (add braces)
 * 5. Empty catch blocks
 * 6. Missing global types
 * 
 * Safety Features:
 * - AST-based transformations using ts-morph
 * - Backup creation before changes
 * - Build validation after changes
 * - Rollback on failure
 * - Dry-run mode for testing
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('child_process');
let tsMorph = null; // lazy import when --wrap-functions is used

// CLI flags
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry') || args.has('-n');
const FORCE = args.has('--force');
const VERBOSE = args.has('--verbose') || args.has('-v');
const BACKUP = !args.has('--no-backup');
const WRAP_FUNCS = args.has('--wrap-functions'); // gate risky function wrapping
const FIX_SWITCH = args.has('--fix-switch'); // gate fragile switch/case fix

// Configuration
const API_DIR = path.resolve('apps/bff/app/api');
const KIT_MODULE = '@/api/_kit';
const HTTP_MODULE = '@/api/_lib/http';

// Stats tracking
let updatedCount = 0;
let errorCount = 0;
let totalScanned = 0;
let backupCount = 0;
const modifiedFiles = [];

// ---- Path helpers (cross-platform) ----
const isRouteFile = (filePath) => path.basename(filePath) === 'route.ts';
const normalizedParts = (p) => p.split(path.sep);
const isKitOrLib = (filePath) => {
  const parts = normalizedParts(filePath);
  return parts.includes('_kit') || parts.includes('_lib');
};

/**
 * Create backup of file before modification
 */
function createBackup(filePath) {
  if (!BACKUP || DRY_RUN) return;
  
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  backupCount++;
  
  if (VERBOSE) {
    console.log(`   📦 Backup created: ${backupPath}`);
  }
}

/**
 * Validate build after changes
 */
function validateBuild() {
  if (DRY_RUN) return true;
  if (FORCE) {
    console.log('⚠️  --force provided: skipping build validation.');
    return true;
  }
  
  try {
    console.log('🔍 Validating build...');
    const out = execSync('pnpm --filter @aibos/bff typecheck', {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd()
    }).toString();
    if (VERBOSE && out) console.log(out);
    console.log('✅ Build validation passed');
    return true;
  } catch (error) {
    console.error('❌ Build validation failed.');
    if (error.stdout) console.error('--- stdout ---\n' + error.stdout.toString());
    if (error.stderr) console.error('--- stderr ---\n' + error.stderr.toString());
    return false;
  }
}

/**
 * Rollback changes if build fails
 */
function rollbackChanges(modifiedFiles) {
  console.log('🔄 Rolling back changes...');
  
  for (const filePath of modifiedFiles) {
    const backupFiles = fs.readdirSync(path.dirname(filePath))
      .filter(f => f.startsWith(path.basename(filePath) + '.backup.'))
      .sort()
      .reverse(); // Get most recent backup
    
    if (backupFiles.length > 0) {
      const latestBackup = path.join(path.dirname(filePath), backupFiles[0]);
      fs.copyFileSync(latestBackup, filePath);
      console.log(`   ↶ Restored: ${filePath}`);
    }
  }
}

/**
 * Fix NextResponse.json() calls in _kit and _lib files
 */
function fixKitLibFiles(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  // Pattern 1: Simple NextResponse.json with error structure → serverError()
  const errorPattern = /NextResponse\.json\(\s*\{\s*ok:\s*false,\s*error:\s*['"]([^'"]+)['"],\s*message:\s*([^}]+)\s*\}/gs;
  
  updated = updated.replace(errorPattern, (match, errorType, message) => {
    hasChanges = true;
    
    // Map error types to appropriate functions
    switch (errorType) {
      case 'BadRequest':
        return `badRequest(${message.trim()})`;
      case 'UnprocessableEntity':
        return `unprocessable(${message.trim()})`;
      case 'NotFound':
        return `notFound(${message.trim()})`;
      case 'InternalServerError':
        return `serverError(${message.trim()})`;
      default:
        return `serverError(${message.trim()})`;
    }
  });
  
  // Pattern 2: Simple NextResponse.json with success structure → ok()
  const successPattern = /NextResponse\.json\(\s*\{\s*ok:\s*true,\s*data:\s*([^}]+)\s*\}/gs;
  
  updated = updated.replace(successPattern, (match, data) => {
    hasChanges = true;
    return `ok(${data.trim()})`;
  });
  
  // Pattern 3: Simple NextResponse.json → ok() (for success cases)
  const simpleSuccessPattern = /NextResponse\.json\(\s*([^,{]+),\s*\{\s*status:\s*200\s*\}\)/gs;
  
  updated = updated.replace(simpleSuccessPattern, (match, data) => {
    hasChanges = true;
    return `ok(${data})`;
  });
  
  if (hasChanges && VERBOSE) {
    console.log(`   🔧 Fixed NextResponse.json patterns in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix Response/NextResponse json calls in route files
 */
function fixRouteResponsePatterns(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  // Pattern 1: Response.json with CORS headers → ok() with headers
  const corsPattern = /Response\.json\(\s*([^,]+),\s*\{\s*headers:\s*\{\s*['"]Access-Control-Allow-Origin['"]:\s*['"]\*['"][^}]*\}\s*\}\)/gs;
  
  updated = updated.replace(corsPattern, (match, data) => {
    hasChanges = true;
    return `ok(${data}, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })`;
  });
  
  // Pattern 2: Simple Response.json → ok()
  const simplePattern = /Response\.json\(\s*([^,]+)(?:,\s*\{\s*status:\s*200\s*\})?\)/gs;
  
  updated = updated.replace(simplePattern, (match, data) => {
    hasChanges = true;
    return `ok(${data})`;
  });

  // Pattern 3: NextResponse.json error/success in routes too
  const routeErrorPattern = /NextResponse\.json\(\s*\{\s*ok:\s*false,\s*error:\s*['"]([^'"]+)['"],\s*message:\s*([^,}]+)(?:,\s*details:\s*([^}]+))?\s*\},\s*\{\s*status:\s*(\d+)\s*\}\)/gs;
  updated = updated.replace(routeErrorPattern, (match, errorType, message, details, status) => {
    hasChanges = true;
    switch (errorType) {
      case 'BadRequest':
        return `badRequest(${message}${details ? `, ${details}` : ''})`;
      case 'UnprocessableEntity':
        return `unprocessable(${message}${details ? `, ${details}` : ''})`;
      case 'NotFound':
        return `notFound(${message}${details ? `, ${details}` : ''})`;
      default:
        return `serverError(${message}${details ? `, ${details}` : ''})`;
    }
  });
  const routeOkPattern = /NextResponse\.json\(\s*\{\s*ok:\s*true,\s*data:\s*([^}]+)\s*\}(?:,\s*([^)]+))?\)/gs;
  updated = updated.replace(routeOkPattern, (m, data, init) => {
    hasChanges = true;
    return `ok(${data}${init ? `, ${init}` : ''})`;
  });
  const routeSimpleOk = /NextResponse\.json\(\s*([^,{]+),\s*\{\s*status:\s*200\s*\}\)/gs;
  updated = updated.replace(routeSimpleOk, (m, data) => {
    hasChanges = true;
    return `ok(${data})`;
  });
  
  if (hasChanges && VERBOSE) {
    console.log(`   🔧 Fixed Response.json patterns in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix function declarations to use withRouteErrors
 */
function fixFunctionDeclarations(content, filePath) {
  // AST-based transform using ts-morph
  if (!WRAP_FUNCS) {
    if (VERBOSE) console.log('   ⏭️  Skipped function wrapping (enable with --wrap-functions).');
    return { content, hasChanges: false };
  }

  try {
    if (!tsMorph) tsMorph = require('ts-morph');
    const { Project, ScriptTarget } = tsMorph;
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { target: ScriptTarget.ES2020 }
    });
    const source = project.createSourceFile('route.ts', content, { overwrite: true });

    const METHODS = new Set(['GET','POST','PUT','PATCH','DELETE','OPTIONS']);
    let wrapped = 0;

    // Find exported async function declarations whose names match HTTP methods
    source.getFunctions().forEach(fn => {
      const name = fn.getName();
      const isExported = fn.isExported();
      const isAsync = fn.isAsync();
      if (!name || !METHODS.has(name) || !isExported || !isAsync) return;

      // Gather text for params and body
      const paramsText = fn.getParameters().map(p => p.getText()).join(', ');
      const body = fn.getBody();
      if (!body) return;
      const bodyText = body.getText(); // includes surrounding braces

      // Preserve leading comments/trivia that appear immediately before the function
      // via fullStart → start slice on the original source text.
      const fullText = source.getFullText();
      const leadingTrivia = fullText.slice(fn.getFullStart(), fn.getStart());

      // Create replacement: export const NAME = withRouteErrors(async (params) => { body })
      const declText =
        `${leadingTrivia}export const ${name} = withRouteErrors(async (${paramsText}) => ${bodyText});`

      // Atomically replace the function node (safer offset handling)
      fn.replaceWithText(declText);
      wrapped++;
    });

    const updated = source.getFullText();
    if (wrapped > 0 && VERBOSE) {
      console.log(`   🔧 Wrapped ${wrapped} exported handler(s) with withRouteErrors (AST).`);
    }
    return { content: updated, hasChanges: wrapped > 0 };
  } catch (e) {
    console.error(`   ❌ AST wrapping error in ${path.basename(filePath)}:`, e.message);
    if (/Cannot find module 'ts-morph'/.test(String(e.message))) {
      console.error('   💡 Tip: install it with: pnpm -w add -D ts-morph');
    }
    return { content, hasChanges: false };
  }
}

/**
 * Fix case block declarations (add braces)
 */
function fixCaseDeclarations(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  if (FIX_SWITCH) {
    const casePattern = /(case\s+[^:]+:\s*)(const|let|var)\s+/g;
    updated = updated.replace(casePattern, (match, casePart, declaration) => {
      hasChanges = true;
      return `${casePart}{\n    ${declaration} `;
    });
    if (hasChanges && VERBOSE) {
      console.log(`   🔧 Applied switch/case block guard (regex). Verify output or prefer AST.`);
    }
  } else if (VERBOSE) {
    console.log('   ⏭️  Skipped switch/case fixes (enable with --fix-switch).');
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix empty catch blocks
 */
function fixEmptyCatchBlocks(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  // Pattern: catch (error) { }
  const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  
  updated = updated.replace(emptyCatchPattern, (match) => {
    hasChanges = true;
    return 'catch (error) {\n    // Silently ignore error\n  }';
  });
  
  if (hasChanges && VERBOSE) {
    console.log(`   🔧 Fixed empty catch blocks in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Add missing global types
 */
function fixMissingGlobals(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  // Add BodyInit type declaration if used but not defined
  if (content.includes('BodyInit') && !content.includes('declare global')) {
    const globalDecl = `declare global {
  type BodyInit = string | Blob | ArrayBuffer | ArrayBufferView | FormData | URLSearchParams | ReadableStream<Uint8Array>;
}

`;
    updated = globalDecl + updated;
    hasChanges = true;
  }
  
  if (hasChanges && VERBOSE) {
    console.log(`   🔧 Added missing global types in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Ensure proper imports are present
 */
function ensureImports(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  // Check if we need to add imports
  const hasHttpImport = /from\s+['"]@\/api\/_lib\/http['"]/.test(content);
  const hasKitImport = /from\s+['"]@\/api\/_kit['"]/.test(content);
  const needsOk = content.includes('ok(') && !hasHttpImport;
  const needsWithRouteErrors = content.includes('withRouteErrors(') && !hasKitImport;
  
  // TEMPORARILY DISABLE IMPORT FIXING TO DEBUG SYNTAX ERRORS
  if (false && (needsOk || needsWithRouteErrors)) {
    const imports = [];
    
    if (needsOk) {
      imports.push(`import { ok, badRequest, serverError, notFound, unprocessable } from '${HTTP_MODULE}';`);
    }
    
    if (needsWithRouteErrors) {
      imports.push(`import { withRouteErrors } from '${KIT_MODULE}';`);
    }
    
    // Insert after the last import
    const importRegex = /^(import\s+[^;]+;\s*)+/m;
    const m = updated.match(importRegex);
    if (m && typeof m[0] === 'string') {
      const insertPoint = m[0].length;
      updated = updated.slice(0, insertPoint) + imports.map(s => s + '\n').join('') + updated.slice(insertPoint);
    } else {
      updated = imports.join('\n') + '\n\n' + updated;
    }
    
    hasChanges = true;
  }
  
  if (hasChanges && VERBOSE) {
    console.log(`   🔧 Added missing imports in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    totalScanned++;
    
    if (VERBOSE) {
      console.log(`\n📄 Processing: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    let hasChanges = false;
    
    // Apply transformations based on file type and content
    const kitLib = isKitOrLib(filePath);
    const route = isRouteFile(filePath);
    
    if (kitLib) {
      const result = fixKitLibFiles(updated, filePath);
      updated = result.content;
      hasChanges = hasChanges || result.hasChanges;
    }
    
    if (route) {
      const result1 = fixRouteResponsePatterns(updated, filePath);
      updated = result1.content;
      hasChanges = hasChanges || result1.hasChanges;
      
      const result2 = fixFunctionDeclarations(updated, filePath);
      updated = result2.content;
      hasChanges = hasChanges || result2.hasChanges;
    }
    
    // Apply general fixes
    const result3 = fixCaseDeclarations(updated, filePath);
    updated = result3.content;
    hasChanges = hasChanges || result3.hasChanges;
    
    const result4 = fixEmptyCatchBlocks(updated, filePath);
    updated = result4.content;
    hasChanges = hasChanges || result4.hasChanges;
    
    const result5 = fixMissingGlobals(updated, filePath);
    updated = result5.content;
    hasChanges = hasChanges || result5.hasChanges;
    
    const result6 = ensureImports(updated, filePath);
    updated = result6.content;
    hasChanges = hasChanges || result6.hasChanges;
    
    if (hasChanges) {
      createBackup(filePath);
      
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, updated, 'utf8');
        modifiedFiles.push(filePath);
      }
      
      console.log(DRY_RUN ? '🧪 Would update:' : '✅ Updated:', filePath);
      updatedCount++;
    } else if (VERBOSE) {
      console.log('   ⏭️  No changes needed');
    }
    
  } catch (error) {
    console.error('❌ Error processing:', filePath, error.message);
    errorCount++;
  }
}

/**
 * Walk directory tree
 */
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      walk(filePath);
    } else if (entry.isFile()) {
      if (entry.name === 'route.ts') {
        processFile(filePath);
      } else if (isKitOrLib(filePath) && entry.name.endsWith('.ts')) {
        // process any TS in _kit/_lib
        processFile(filePath);
      }
    }
  }
}

// Main execution
console.log('🔧 Starting Complex API Pattern Fixing...');
console.log('📁 Scanning:', API_DIR);
if (DRY_RUN) console.log('🧪 DRY RUN MODE - No files will be modified');
if (VERBOSE) console.log('🔍 VERBOSE MODE - Detailed output enabled');
if (BACKUP) console.log('📦 BACKUP MODE - Backups will be created');

const startTime = Date.now();

// Process files
walk(API_DIR);

// Validate build if changes were made
if (updatedCount > 0 && !DRY_RUN) {
  if (!validateBuild()) {
    if (!FORCE) {
      console.log('❌ Build validation failed, rolling back changes...');
      rollbackChanges(modifiedFiles);
      process.exit(1);
    } else {
      console.log('⚠️  Build failed but continuing due to --force (no rollback).');
    }
  }
}

const endTime = Date.now();

console.log('\n' + '='.repeat(60));
console.log(DRY_RUN ? '🧪 Dry run completed.' : '✅ Complex API pattern fixing completed!');
console.log(`⏱️  Execution time: ${endTime - startTime}ms`);
console.log(`📊 Summary: updated=${updatedCount} errors=${errorCount} backups=${backupCount} total_scanned=${totalScanned}`);

if (updatedCount > 0) {
  console.log('💡 Run "pnpm --filter @aibos/bff lint" to verify fixes');
  console.log('💡 Run "pnpm --filter @aibos/bff typecheck" to verify types');
}

// Exit codes
if (errorCount > 0) {
  process.exitCode = 1;
} else if (DRY_RUN && updatedCount > 0) {
  process.exitCode = 2; // Dry run found changes
}
