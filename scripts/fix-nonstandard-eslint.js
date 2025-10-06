#!/usr/bin/env node

/**
 * Script to automatically add ESLint disable comments to @api:nonstandard files
 * This prevents false positives from ESLint rules that don't apply to non-standard API routes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with @api:nonstandard annotation
function findNonstandardFiles() {
  const files = [];

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@api:nonstandard')) {
              files.push(fullPath);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scanDirectory('apps/bff/app/api');
  return files;
}

// Check if file already has ESLint disable comment
function hasEslintDisable(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return (
      content.includes('eslint-disable') &&
      content.includes('no-restricted-syntax')
    );
  } catch (error) {
    return false;
  }
}

// Add ESLint disable comment to file
function addEslintDisable(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if already has the disable comment
    if (hasEslintDisable(filePath)) {
      console.log(`✅ ${filePath} - Already has ESLint disable comment`);
      return false;
    }

    // Find the @api:nonstandard line and add disable comment after it
    const lines = content.split('\n');
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('@api:nonstandard')) {
        insertIndex = i + 1;
        break;
      }
    }

    if (insertIndex === -1) {
      console.log(
        `⚠️  ${filePath} - Could not find @api:nonstandard annotation`
      );
      return false;
    }

    // Insert the ESLint disable comment
    const disableComment = '/* eslint-disable no-restricted-syntax */';
    lines.splice(insertIndex, 0, disableComment);

    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ ${filePath} - Added ESLint disable comment`);
    return true;
  } catch (error) {
    console.error(`❌ ${filePath} - Error: ${error.message}`);
    return false;
  }
}

// Main execution
function main() {
  console.log('🔍 Finding files with @api:nonstandard annotation...\n');

  const files = findNonstandardFiles();

  if (files.length === 0) {
    console.log('No files found with @api:nonstandard annotation');
    return;
  }

  console.log(
    `Found ${files.length} files with @api:nonstandard annotation:\n`
  );

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  files.forEach(file => {
    console.log(`Processing: ${file}`);

    if (hasEslintDisable(file)) {
      skipped++;
    } else {
      const success = addEslintDisable(file);
      if (success) {
        processed++;
      } else {
        errors++;
      }
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Processed: ${processed} files`);
  console.log(`   ⏭️  Skipped: ${skipped} files (already had disable comment)`);
  console.log(`   ❌ Errors: ${errors} files`);
  console.log(`   📁 Total: ${files.length} files`);

  if (processed > 0) {
    console.log(
      `\n🎉 Successfully added ESLint disable comments to ${processed} files!`
    );
    console.log('   Run "pnpm lint" to verify the fixes.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { findNonstandardFiles, addEslintDisable, hasEslintDisable };
