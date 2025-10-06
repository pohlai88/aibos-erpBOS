#!/usr/bin/env node
// Clean up scattered test files and organize M01 tests properly

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import path from 'path';

const testFilesToRemove = [
  // Remove scattered web tests
  'apps/web/__tests__/basic.test.ts',
  'apps/web/hooks/__tests__/useAccounts.test.ts',
  'apps/web/components/core-ledger/__tests__/CoreLedger.test.tsx',
  
  // Remove scattered BFF tests (keep only M01 relevant ones)
  'apps/bff/app/api/accounts/__tests__/accounts.test.ts',
];

const testDirectoriesToRemove = [
  'apps/web/__tests__',
  'apps/web/hooks/__tests__',
  'apps/web/components/core-ledger/__tests__',
];

console.log('🧹 Cleaning up scattered test files...');

// Remove individual test files
testFilesToRemove.forEach(file => {
  if (existsSync(file)) {
    console.log(`Removing: ${file}`);
    rmSync(file, { recursive: true, force: true });
  }
});

// Remove empty test directories
testDirectoriesToRemove.forEach(dir => {
  if (existsSync(dir)) {
    try {
      const files = execSync(`ls -la "${dir}"`, { encoding: 'utf8' });
      if (files.trim().split('\n').length <= 3) { // Only . and .. entries
        console.log(`Removing empty directory: ${dir}`);
        rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      // Directory might not exist or be empty
    }
  }
});

console.log('✅ Test cleanup completed!');
console.log('📁 M01 tests are now organized in: tests/m01-core-ledger/');
console.log('🚀 Run tests with: pnpm test:m01');
