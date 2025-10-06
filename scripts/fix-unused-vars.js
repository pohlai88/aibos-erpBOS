#!/usr/bin/env node

/**
 * Script to fix unused variable warnings by prefixing with underscore
 * This addresses @typescript-eslint/no-unused-vars warnings
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the list of files with unused variable warnings
function getLintOutput() {
  try {
    const output = execSync('pnpm -w lint', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return output;
  } catch (error) {
    // Return the stderr output which contains the lint warnings
    return error.stdout || error.stderr || '';
  }
}

// Parse lint output to extract file paths and line numbers
function parseLintOutput(output) {
  const lines = output.split('\n');
  const issues = [];

  for (const line of lines) {
    // Match lines like: "D:\aibos-erpBOS\apps\bff\app\services\controls\auto\index.ts"
    if (
      line.includes('@typescript-eslint/no-unused-vars') &&
      line.includes('warning')
    ) {
      const match = line.match(
        /^(.+?):\s*(\d+):(\d+)\s+warning\s+(.+?)\s+@typescript-eslint\/no-unused-vars$/
      );
      if (match) {
        const [, filePath, lineNum, colNum, message] = match;
        issues.push({
          file: filePath.trim(),
          line: parseInt(lineNum),
          column: parseInt(colNum),
          message: message.trim(),
        });
      }
    }
  }

  return issues;
}

// Fix unused variables in a file
function fixUnusedVarsInFile(filePath, issues) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  // Sort issues by line number in descending order to avoid line number shifts
  const fileIssues = issues
    .filter(issue => issue.file === filePath)
    .sort((a, b) => b.line - a.line);

  for (const issue of fileIssues) {
    const lineIndex = issue.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];

      // Check if this is an unused variable assignment
      if (
        issue.message.includes('is assigned a value but never used') ||
        issue.message.includes('is defined but never used')
      ) {
        // Extract variable name from the message
        const varMatch = issue.message.match(/['"`]([^'"`]+)['"`]/);
        if (varMatch) {
          const varName = varMatch[1];

          // Replace variable name with underscore prefix
          const newLine = line.replace(
            new RegExp(`\\b${varName}\\b`, 'g'),
            `_${varName}`
          );

          if (newLine !== line) {
            lines[lineIndex] = newLine;
            modified = true;
            console.log(
              `Fixed unused variable '${varName}' in ${filePath}:${issue.line}`
            );
          }
        }
      }

      // Check if this is an unused function parameter
      if (issue.message.includes('unused args must match')) {
        const paramMatch = issue.message.match(/['"`]([^'"`]+)['"`]/);
        if (paramMatch) {
          const paramName = paramMatch[1];

          // Replace parameter name with underscore prefix
          const newLine = line.replace(
            new RegExp(`\\b${paramName}\\b`, 'g'),
            `_${paramName}`
          );

          if (newLine !== line) {
            lines[lineIndex] = newLine;
            modified = true;
            console.log(
              `Fixed unused parameter '${paramName}' in ${filePath}:${issue.line}`
            );
          }
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Updated file: ${filePath}`);
  }
}

// Main execution
function main() {
  console.log('🔍 Analyzing lint output for unused variables...');

  const lintOutput = getLintOutput();
  const issues = parseLintOutput(lintOutput);

  console.log(`Found ${issues.length} unused variable warnings`);

  // Group issues by file
  const filesToFix = [...new Set(issues.map(issue => issue.file))];

  console.log(`Processing ${filesToFix.length} files...`);

  for (const filePath of filesToFix) {
    try {
      fixUnusedVarsInFile(filePath, issues);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }

  console.log('✅ Unused variable fixes completed');
}

if (require.main === module) {
  main();
}

module.exports = { parseLintOutput, fixUnusedVarsInFile };
