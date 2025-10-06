#!/usr/bin/env node

/**
 * Complex API Pattern Fixer - DEMO VERSION
 * 
 * Tests the script on demo files before running on the full codebase
 */

const fs = require('node:fs');
const path = require('node:path');

// CLI flags
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry') || args.has('-n');
const VERBOSE = args.has('--verbose') || args.has('-v');

// Configuration - Target demo files only
const DEMO_DIR = path.resolve('apps/bff/app/api/demo-test');
const DEMO_KIT_FILE = path.resolve('apps/bff/app/api/_kit/demo-test.ts');

// Stats tracking
let updatedCount = 0;
let errorCount = 0;
let totalScanned = 0;

/**
 * Fix NextResponse.json() calls in _kit files
 */
function fixKitLibFiles(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing NextResponse.json patterns...');
  
  // Pattern 1: NextResponse.json with error structure → serverError()
  const errorPattern = /NextResponse\.json\(\s*\{\s*ok:\s*false,\s*error:\s*['"]([^'"]+)['"],\s*message:\s*([^,}]+)(?:,\s*details:\s*([^}]+))?\s*\},\s*\{\s*status:\s*(\d+)\s*\}\)/gs;
  
  updated = updated.replace(errorPattern, (match, errorType, message, details, status) => {
    hasChanges = true;
    console.log(`   🔧 Found error pattern: ${errorType} - ${message}`);
    
    // Map error types to appropriate functions
    switch (errorType) {
      case 'BadRequest':
        return `badRequest(${message}${details ? `, ${details}` : ''})`;
      case 'UnprocessableEntity':
        return `unprocessable(${message}${details ? `, ${details}` : ''})`;
      case 'NotFound':
        return `notFound(${message}${details ? `, ${details}` : ''})`;
      case 'InternalServerError':
        return `serverError(${message}${details ? `, ${details}` : ''})`;
      default:
        return `serverError(${message}${details ? `, ${details}` : ''})`;
    }
  });
  
  // Pattern 2: NextResponse.json with success structure → ok()
  const successPattern = /NextResponse\.json\(\s*\{\s*ok:\s*true,\s*data:\s*([^}]+)\s*\}(?:,\s*([^)]+))?\)/gs;
  
  updated = updated.replace(successPattern, (match, data, init) => {
    hasChanges = true;
    console.log(`   🔧 Found success pattern: ${data}`);
    return `ok(${data}${init ? `, ${init}` : ''})`;
  });
  
  // Pattern 3: Simple NextResponse.json → ok()
  const simpleSuccessPattern = /NextResponse\.json\(\s*([^,{]+),\s*\{\s*status:\s*200\s*\}\)/gs;
  
  updated = updated.replace(simpleSuccessPattern, (match, data) => {
    hasChanges = true;
    console.log(`   🔧 Found simple success pattern: ${data}`);
    return `ok(${data})`;
  });
  
  if (hasChanges) {
    console.log(`   ✅ Fixed NextResponse.json patterns in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix Response.json() calls in route files
 */
function fixRouteResponsePatterns(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing Response.json patterns...');
  
  // Pattern 1: Response.json with CORS headers → ok() with headers
  const corsPattern = /Response\.json\(\s*([^,]+),\s*\{\s*headers:\s*\{\s*['"]Access-Control-Allow-Origin['"]:\s*['"]\*['"][^}]*\}\s*\}\)/gs;
  
  updated = updated.replace(corsPattern, (match, data) => {
    hasChanges = true;
    console.log(`   🔧 Found CORS pattern: ${data}`);
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
    console.log(`   🔧 Found simple Response.json pattern: ${data}`);
    return `ok(${data})`;
  });
  
  if (hasChanges) {
    console.log(`   ✅ Fixed Response.json patterns in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix function declarations to use withRouteErrors
 */
function fixFunctionDeclarations(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing function declarations...');
  
  // Pattern: export async function METHOD → export const METHOD = withRouteErrors(async
  const functionPattern = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s*\(/g;
  
  updated = updated.replace(functionPattern, (match, method) => {
    hasChanges = true;
    console.log(`   🔧 Found function declaration: ${method}`);
    return `export const ${method} = withRouteErrors(async (`;
  });
  
  if (hasChanges) {
    console.log(`   ✅ Fixed function declarations in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix case block declarations (add braces)
 */
function fixCaseDeclarations(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing case declarations...');
  
  // Pattern: case 'value': const/let/var declaration
  const casePattern = /(case\s+[^:]+:\s*)(const|let|var)\s+/g;
  
  updated = updated.replace(casePattern, (match, casePart, declaration) => {
    hasChanges = true;
    console.log(`   🔧 Found case declaration: ${declaration}`);
    return `${casePart}{\n    ${declaration} `;
  });
  
  if (hasChanges) {
    console.log(`   ✅ Fixed case declarations in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Fix empty catch blocks
 */
function fixEmptyCatchBlocks(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing empty catch blocks...');
  
  // Pattern: catch (error) { } or catch (error) { // comment }
  const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*(?:\/\/[^\n]*)?\s*\}/gs;
  
  updated = updated.replace(emptyCatchPattern, (match) => {
    hasChanges = true;
    console.log(`   🔧 Found empty catch block`);
    return 'catch (error) {\n    // Silently ignore error\n  }';
  });
  
  if (hasChanges) {
    console.log(`   ✅ Fixed empty catch blocks in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Add missing global types
 */
function fixMissingGlobals(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing missing globals...');
  
  // Add BodyInit type declaration if used but not defined
  if (content.includes('BodyInit') && !content.includes('declare global')) {
    console.log(`   🔧 Found missing BodyInit type`);
    const globalDecl = `declare global {
  type BodyInit = string | Blob | ArrayBuffer | ArrayBufferView | FormData | URLSearchParams | ReadableStream<Uint8Array>;
}

`;
    updated = globalDecl + updated;
    hasChanges = true;
  }
  
  if (hasChanges) {
    console.log(`   ✅ Added missing global types in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Ensure proper imports are present
 */
function ensureImports(content, filePath) {
  let updated = content;
  let hasChanges = false;
  
  console.log('🔍 Analyzing imports...');
  
  // Check if we need to add imports
  const needsOk = content.includes('ok(') && !content.includes('from \'@/api/_lib/http\'');
  const needsWithRouteErrors = content.includes('withRouteErrors(') && !content.includes('from \'@/api/_kit\'');
  
  if (needsOk || needsWithRouteErrors) {
    const imports = [];
    
    if (needsOk) {
      console.log(`   🔧 Need to add HTTP imports`);
      imports.push(`import { ok, badRequest, serverError } from '@/api/_lib/http';`);
    }
    
    if (needsWithRouteErrors) {
      console.log(`   🔧 Need to add withRouteErrors import`);
      imports.push(`import { withRouteErrors } from '@/api/_kit';`);
    }
    
    // Find the best insertion point (after existing imports)
    const importMatch = updated.match(/^import.*?;$/m);
    if (importMatch) {
      const insertPoint = importMatch.index + importMatch[0].length;
      updated = updated.slice(0, insertPoint) + '\n' + imports.join('\n') + '\n' + updated.slice(insertPoint);
    } else {
      updated = imports.join('\n') + '\n\n' + updated;
    }
    
    hasChanges = true;
  }
  
  if (hasChanges) {
    console.log(`   ✅ Added missing imports in ${path.basename(filePath)}`);
  }
  
  return { content: updated, hasChanges };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    totalScanned++;
    
    console.log(`\n📄 Processing: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    let hasChanges = false;
    
    // Apply transformations based on file type and content
    const isKitLib = filePath.includes('/_kit/');
    const isRoute = filePath.endsWith('/route.ts');
    
    if (isKitLib) {
      const result = fixKitLibFiles(updated, filePath);
      updated = result.content;
      hasChanges = hasChanges || result.hasChanges;
    }
    
    if (isRoute) {
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
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, updated, 'utf8');
      }
      
      console.log(DRY_RUN ? '🧪 Would update:' : '✅ Updated:', filePath);
      updatedCount++;
    } else {
      console.log('   ⏭️  No changes needed');
    }
    
  } catch (error) {
    console.error('❌ Error processing:', filePath, error.message);
    errorCount++;
  }
}

// Main execution
console.log('🔧 Starting Complex API Pattern Fixing - DEMO VERSION');
console.log('📁 Scanning demo files only');
if (DRY_RUN) console.log('🧪 DRY RUN MODE - No files will be modified');
if (VERBOSE) console.log('🔍 VERBOSE MODE - Detailed output enabled');

const startTime = Date.now();

// Process demo files
if (fs.existsSync(DEMO_DIR)) {
  processFile(path.join(DEMO_DIR, 'route.ts'));
}

if (fs.existsSync(DEMO_KIT_FILE)) {
  processFile(DEMO_KIT_FILE);
}

const endTime = Date.now();

console.log('\n' + '='.repeat(60));
console.log(DRY_RUN ? '🧪 Demo dry run completed.' : '✅ Demo pattern fixing completed!');
console.log(`⏱️  Execution time: ${endTime - startTime}ms`);
console.log(`📊 Summary: updated=${updatedCount} errors=${errorCount} total_scanned=${totalScanned}`);

if (updatedCount > 0) {
  console.log('💡 Demo completed successfully! Ready to run on full codebase.');
  console.log('💡 Run "pnpm api:complex:dry" to test on all files');
  console.log('💡 Run "pnpm api:complex:fix" to apply fixes to all files');
}

// Exit codes
if (errorCount > 0) {
  process.exitCode = 1;
} else if (DRY_RUN && updatedCount > 0) {
  process.exitCode = 2; // Dry run found changes
}
