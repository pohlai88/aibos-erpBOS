import { describe, it, expect, beforeAll } from 'vitest';

// IMPORTANT: make Node expose helpers from the script
process.env.EXPORT_API_SECURITY_HELPERS = '1';

// Import the helpers from your script
// Adjust the relative path if your file lives elsewhere
const {
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
} = require('../scripts/api-security.js');

const baseRoute = `import { withRouteErrors } from "@/api/_kit";
import { requireAuth, requireCapability } from "@/api/_kit/auth";

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const cap = requireCapability(auth, "capex:manage");
  if (cap instanceof Response) return cap;

  // handler...
  return Response.json({ ok: true });
});
`;

const baseRouteIsResponse = `import { withRouteErrors } from "@/api/_kit";
import { requireAuth, requireCapability, isResponse } from "@/api/_kit/auth";

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capability = requireCapability(auth, "capex:manage");
  if (isResponse(capability)) return capability;

  // handler...
  return Response.json({ ok: true });
});
`;

describe('upload detection', () => {
  it('detects upload routes with multiple signals', () => {
    const content =
      baseRoute +
      `
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const text = await file.text();
    `;
    expect(isFileUploadRoute(content)).toBe(true);
    expect(detectUploadPattern(content)).toBe('generic');
  });

  it('detects csv-direct and multipart-with-mapping', () => {
    const c1 = `
      const formData = await req.formData();
      const csvFile = formData.get('csv') as File;
    `;
    expect(isFileUploadRoute(c1)).toBe(true);
    expect(detectUploadPattern(c1)).toBe('csv-direct');

    const c2 = `
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const mapping = JSON.parse(formData.get('mapping') as string);
    `;
    expect(isFileUploadRoute(c2)).toBe(true);
    expect(detectUploadPattern(c2)).toBe('multipart-with-mapping');
  });
});

describe('runtime injection', () => {
  it('adds runtime=nodejs once and is idempotent', () => {
    const once = addRuntimeExport(baseRoute);
    expect(once).toMatch(/export const runtime = "nodejs"/);

    const twice = addRuntimeExport(once);
    // no duplicate
    expect(twice.match(/export const runtime = "nodejs"/g)?.length).toBe(1);
  });
});

describe('import management', () => {
  it('adds fileUploadResponse/serverError/validateFileUpload imports as needed', () => {
    const content = `
      import { withRouteErrors } from "${process.env.API_KIT_ALIAS || '@/api/_kit'}";
      export const POST = () => {};
    `;
    const updated = manageImports(content);
    // tolerate either order, just assert presence
    expect(updated).toMatch(/from\s+"@\/api\/_lib\/http"/);
    expect(updated).toMatch(/fileUploadResponse/);
    expect(updated).toMatch(/serverError/);
    expect(updated).toMatch(/from\s+"@\/api\/_lib\/file-upload"/);
    expect(updated).toMatch(/validateFileUpload/);
  });
});

describe('response standardization', () => {
  it('replaces Response.json success/error with fileUploadResponse/serverError', () => {
    const content = `
      // success pattern
      return Response.json({ result, message: result.success ? 'ok' : 'bad' }, { status: result.success ? 200 : 400, headers: { "Access-Control-Allow-Origin": "*" } });

      // error patterns
      return Response.json({ error: "no file" }, { status: 400 });
      return Response.json({ error: "failed" }, { status: 500 });
      return NextResponse.json({ error: "bad req" }, { status: 400 });
      return NextResponse.json({ error: "oops" }, { status: 500 });
    `;
    const updated = convertResponsePatterns(content);
    expect(updated).toMatch(/fileUploadResponse\(result/);
    expect(updated).toMatch(/serverError\("Failed to process file upload"\)/);
  });
});

describe('transform patterns', () => {
  it('rewrites multipart-with-mapping to use validateFileUpload()', () => {
    const content = `
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const mapping = JSON.parse(formData.get('mapping') as string);
      if (!file) { return Response.json({ error: "No file provided" }, { status: 400 }); }
    `;
    const updated = transformUploadPattern(content, 'multipart-with-mapping');
    expect(updated).toMatch(/validateFileUpload\(req, \['mapping'\]\)/);
    expect(updated).toMatch(/const \{ file, data \} = validation;/);
    expect(updated).toMatch(
      /const mapping = JSON\.parse\(data\.mapping as string\)/
    );
  });

  it('rewrites csv-direct to use validateFileUpload()', () => {
    const content = `
      const formData = await req.formData();
      const csvFile = formData.get('csv') as File;
    `;
    const updated = transformUploadPattern(content, 'csv-direct');
    expect(updated).toMatch(
      /const validation = await validateFileUpload\(req, \[\]\)/
    );
    expect(updated).toMatch(/const csvFile = validation\.file/);
  });
});

describe('guards injection', () => {
  beforeAll(() => {
    // turn on guard flags for this test run
    process.argv.push('--limit');
    process.argv.push('--audit-attempt');
  });

  it('injects rateLimit + attempt audit after instanceof Response capability gate', () => {
    const content = `import { withRouteErrors } from "@/api/_kit";
import { requireAuth, requireCapability } from "@/api/_kit/auth";

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const cap = requireCapability(auth, "capex:manage");
  if (cap instanceof Response) return cap;

  const formData = await req.formData();
  const file = formData.get('file') as File;
});`;
    const out = injectGuards(content, {
      injectLimit: true,
      injectAuditAttempt: true,
    });
    expect(out).toMatch(/rateLimit\(\{/);
    expect(out).toMatch(/tooManyRequests\(/);
    expect(out).toMatch(/logAuditAttempt\(\{/);
    // key scope looks right
    expect(out).toMatch(
      /key:\s*`upload:\${auth\.company_id}:\${auth\.user_id}`/
    );
  });

  it('injects under isResponse(capability) style too', () => {
    const content = `import { withRouteErrors } from "@/api/_kit";
import { requireAuth, requireCapability, isResponse } from "@/api/_kit/auth";

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capability = requireCapability(auth, "capex:manage");
  if (isResponse(capability)) return capability;

  const formData = await req.formData();
  const file = formData.get('file') as File;
});`;
    const out = injectGuards(content, {
      injectLimit: true,
      injectAuditAttempt: true,
    });
    expect(out).toMatch(/rateLimit\(\{/);
    expect(out).toMatch(/logAuditAttempt\(\{/);
  });

  it('honors pragma @guard:limit X/Y', () => {
    const content = `import { withRouteErrors } from "@/api/_kit";
import { requireAuth, requireCapability } from "@/api/_kit/auth";

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const cap = requireCapability(auth, "capex:manage");
  if (cap instanceof Response) return cap;

  const formData = await req.formData();
  const file = formData.get('file') as File;
});

// @guard:limit 10/120000
`;
    const out = injectGuards(content, {
      injectLimit: true,
      injectAuditAttempt: true,
    });
    expect(out).toMatch(/limit:\s*10/);
    expect(out).toMatch(/windowMs:\s*120000/);
  });
});

describe('analysis helpers', () => {
  it('recognizes hardening status fields', () => {
    const content = `
      export const runtime = "nodejs";
      import { fileUploadResponse, serverError } from "@/api/_lib/http";
      import { validateFileUpload } from "@/api/_lib/file-upload";
      import { withRouteErrors } from "@/api/_kit";
      
      export const POST = withRouteErrors(async (req) => {
        // Usage examples
        return fileUploadResponse(result);
        const validation = await validateFileUpload(req, []);
      });
    `;
    const status = analyzeHardeningStatus(content);
    expect(status.hasRuntime).toBe(true);
    expect(status.hasFileUploadResponse).toBe(true);
    expect(status.hasValidateFileUpload).toBe(true);
    expect(status.hasWithRouteErrors).toBe(true);
    expect(status.isFullyHardened).toBe(true);
  });
});

describe('wrapper and nonstandard checks', () => {
  it('detects withRouteErrors wrapper', () => {
    expect(hasWrapper(baseRoute)).toBe(true);
    expect(hasWrapper('export const POST = () => {}')).toBe(false);
  });

  it('detects nonstandard routes', () => {
    expect(
      isNonstandard('// @api:nonstandard\n export const POST = () => {}')
    ).toBe(true);
    expect(isNonstandard(baseRoute)).toBe(false);
  });
});
