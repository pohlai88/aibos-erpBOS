import fs from 'node:fs';
import path from 'node:path';

const openapiPath = 'packages/contracts/openapi/openapi.json';
const apiDir = 'apps/bff/app/api';

// Check if OpenAPI file exists
if (!fs.existsSync(openapiPath)) {
  console.error('❌ OpenAPI file not found:', openapiPath);
  console.error("💡 Run 'pnpm contracts:gen' to generate OpenAPI spec");
  process.exit(1);
}

const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
const paths = Object.keys(openapi.paths || {});

const filePaths: string[] = [];

function walk(dir: string) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p);
    } else if (e.isFile() && e.name === 'route.ts') {
      const rel =
        '/' + path.relative(apiDir, path.dirname(p)).replace(/\\/g, '/');
      const apiPath =
        rel === '/' ? '/' : `/api${rel.startsWith('/') ? rel : '/' + rel}`;
      filePaths.push(apiPath);
    }
  }
}

console.log('🔍 Scanning API routes...');
walk(apiDir);

const toSet = (arr: string[]) => new Set(arr);
const fsSet = toSet(filePaths);
const oaSet = toSet(paths);

// Convert OpenAPI paths to match filesystem paths
const oaPaths = paths.map(p => `/api${p}`);

const missingInOA = [...fsSet].filter(p => !oaPaths.includes(p));
const missingInFS = [...oaPaths].filter(p => !fsSet.has(p));

if (missingInOA.length || missingInFS.length) {
  console.error('❌ OpenAPI drift detected!');

  if (missingInOA.length) {
    console.error('\n📁 Routes in filesystem but not in OpenAPI:');
    missingInOA.forEach(p => console.error(`  - ${p}`));
  }

  if (missingInFS.length) {
    console.error('\n📋 Routes in OpenAPI but not in filesystem:');
    missingInFS.forEach(p => console.error(`  - ${p}`));
  }

  console.error('\n💡 To fix this drift:');
  console.error('  1. Add missing routes to OpenAPI registry');
  console.error('  2. Remove stale routes from OpenAPI registry');
  console.error("  3. Run 'pnpm contracts:gen' to regenerate");

  process.exit(1);
} else {
  console.log('✅ OpenAPI spec is in sync with filesystem');
  console.log(`📊 Found ${filePaths.length} API routes`);
}
