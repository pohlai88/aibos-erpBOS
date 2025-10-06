'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const node_fs_1 = __importDefault(require('node:fs'));
const node_path_1 = __importDefault(require('node:path'));
const API_DIR = node_path_1.default.resolve('apps/bff/app/api');
// HTTP methods we care about
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const findings = [];
function isMetaOnly(txt) {
  const hasMeta =
    /\bexport\s+const\s+(runtime|preferredRegion|dynamic|revalidate)\b/.test(
      txt
    );
  const hasHandlers = new RegExp(
    `\\bexport\\s+(async\\s+function|const)\\s+(${METHODS.join('|')})\\b`
  ).test(txt);
  return hasMeta && !hasHandlers;
}
function hasWrapper(txt) {
  // Accept:
  // 1) export const GET = withRouteErrors(
  // 2) const GET = withRouteErrors( ... ); export { GET }  (looser)
  return (
    /\bwithRouteErrors\s*\(/.test(txt) &&
    /\b(GET|POST|PUT|PATCH|DELETE|OPTIONS)\b/.test(txt)
  );
}
function approvedException(txt) {
  // A single tag to allow intentional nonstandard usage (must also be justified category)
  return /@api:nonstandard/.test(txt);
}
function detectCategory(txt) {
  if (/new\s+Response\s*\(/.test(txt)) return 'new-response';
  if (/\bReadableStream\b/.test(txt)) return 'stream';
  if (/NextResponse\.redirect/.test(txt)) return 'redirect';
  if (/headers\s*:\s*\{/.test(txt)) return 'custom-headers';
  return null;
}
function methodHits(txt) {
  const hits = [];
  for (const m of METHODS) {
    if (
      new RegExp(`\\bexport\\s+(?:const|async\\s+function)\\s+${m}\\b`).test(
        txt
      )
    )
      hits.push(m);
  }
  return hits;
}
function scan(file) {
  const txt = node_fs_1.default.readFileSync(file, 'utf8');
  if (isMetaOnly(txt)) {
    findings.push({ file, reason: 'meta-only', methodHits: [] });
    return;
  }
  const cat = detectCategory(txt);
  const wrapped = hasWrapper(txt);
  const methods = methodHits(txt);
  if (wrapped) return; // good
  if (cat) {
    // nonstandard responders that we want to keep — but require a tag
    if (approvedException(txt)) {
      findings.push({
        file,
        reason: 'approved-exception',
        methodHits: methods,
      });
    } else {
      findings.push({ file, reason: cat, methodHits: methods });
    }
    return;
  }
  // default: missing wrapper
  findings.push({ file, reason: 'missing-wrapper', methodHits: methods });
}
function walk(dir) {
  for (const entry of node_fs_1.default.readdirSync(dir, {
    withFileTypes: true,
  })) {
    const p = node_path_1.default.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && entry.name === 'route.ts') scan(p);
  }
}
walk(API_DIR);
// Print results & fail if any unapproved items
const groups = findings.reduce((acc, f) => {
  var _a;
  (acc[(_a = f.reason)] || (acc[_a] = [])).push(f);
  return acc;
}, {});
function printGroup(key, title) {
  const items = groups[key] || [];
  if (!items.length) return;
  console.log(`\n=== ${title} (${items.length}) ===`);
  for (const f of items) {
    console.log(
      `- ${f.file}${f.methodHits.length ? ` [${f.methodHits.join(',')}]` : ''}`
    );
  }
}
printGroup('missing-wrapper', 'Missing withRouteErrors');
printGroup('new-response', 'Uses new Response()');
printGroup('custom-headers', 'Custom headers in Response');
printGroup('stream', 'Streams/ReadableStream');
printGroup('redirect', 'NextResponse.redirect');
printGroup('meta-only', 'Meta-only route files');
printGroup('approved-exception', 'Approved nonstandard (tagged)');
const hardFailures =
  (groups['missing-wrapper']?.length ?? 0) +
  (groups['new-response']?.length ?? 0) +
  (groups['custom-headers']?.length ?? 0) +
  (groups['stream']?.length ?? 0) +
  (groups['redirect']?.length ?? 0);
if (hardFailures > 0) {
  console.error(
    '\n❌ Wrapper/response policy violations found. For legitimate exceptions, add an inline tag:'
  );
  console.error('// @api:nonstandard (new Response|headers|stream|redirect)');
  process.exit(1);
} else {
  console.log('\n✅ API wrapper check passed.');
}
