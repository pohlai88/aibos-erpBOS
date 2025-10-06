import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { getTaxReturns } from '@/services/tax_return/templates';

// GET /api/tax/returns - List tax returns
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const partnerCode = url.searchParams.get('partner_code');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  const returns = await getTaxReturns(
    auth.company_id,
    partnerCode || undefined,
    year ? parseInt(year) : undefined,
    month ? parseInt(month) : undefined
  );

  return ok(returns);
});

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
