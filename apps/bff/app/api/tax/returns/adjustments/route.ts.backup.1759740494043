import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  upsertTaxAdjustment,
  getTaxAdjustments,
} from '@/services/tax_return/templates';
import { TaxAdjustmentUpsert } from '@aibos/contracts';

// GET /api/tax/returns/adjustments - Get tax adjustments
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const partnerCode = url.searchParams.get('partner_code');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  if (!partnerCode || !year || !month) {
    return badRequest('partner_code, year, and month are required');
  }

  const adjustments = await getTaxAdjustments(
    auth.company_id,
    partnerCode,
    parseInt(year),
    parseInt(month)
  );
  return ok(adjustments);
});

// POST /api/tax/returns/adjustments - Create or update tax adjustment
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxAdjustmentUpsert.parse(json);

  const result = await upsertTaxAdjustment(
    auth.company_id,
    input,
    auth.user_id
  );
  return ok(result);
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
