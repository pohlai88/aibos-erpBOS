import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  exportTaxReturn,
  getTaxReturnExports,
} from '@/services/tax_return/export';
import { TaxExportRequest } from '@aibos/contracts';

// POST /api/tax/returns/export - Export tax return
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxExportRequest.parse(json);

  const result = await exportTaxReturn(input.run_id, input);
  return ok(result);
});

// GET /api/tax/returns/export - Get export history
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const runId = url.searchParams.get('run_id');

  if (!runId) {
    return badRequest('run_id is required');
  }

  const exports = await getTaxReturnExports(runId);
  return ok(exports);
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
