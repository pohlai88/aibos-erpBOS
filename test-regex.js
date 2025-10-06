const fs = require('fs');
const content = fs.readFileSync('apps/bff/app/api/_kit/demo-test.ts', 'utf8');

console.log('Testing updated regex patterns...\n');

// Test the multi-line error pattern
const multiLineErrorPattern =
  /NextResponse\.json\(\s*\{\s*ok:\s*false,\s*error:\s*['"]([^'"]+)['"],\s*message:\s*([^,}]+)(?:,\s*details:\s*[^}]+)?\s*\},\s*\{\s*status:\s*(\d+)\s*\}\)/gs;

let match;
let found = false;
while ((match = multiLineErrorPattern.exec(content)) !== null) {
  found = true;
  console.log('Found multi-line error pattern:');
  console.log('Full match:', match[0]);
  console.log('Error type:', match[1]);
  console.log('Message:', match[2]);
  console.log('Status:', match[3]);
  console.log('---');
}

if (!found) {
  console.log('No multi-line error patterns found');

  // Let's try to find any NextResponse.json with ok: false
  const simpleErrorPattern = /NextResponse\.json\([^}]*ok:\s*false[^}]*\}\)/gs;
  let simpleMatch;
  while ((simpleMatch = simpleErrorPattern.exec(content)) !== null) {
    console.log('Found simple error pattern:', simpleMatch[0]);
  }
}
