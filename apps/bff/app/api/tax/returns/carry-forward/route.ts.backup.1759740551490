import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { getCarryForwards } from '@/services/tax_return/carry_forward';

// GET /api/tax/returns/carry-forward - List carry forwards
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const fromYear = url.searchParams.get('from_year');
  const fromMonth = url.searchParams.get('from_month');
  const intoYear = url.searchParams.get('into_year');
  const intoMonth = url.searchParams.get('into_month');

  const filters: any = {};
  if (status) filters.status = status;
  if (fromYear) filters.from_year = parseInt(fromYear);
  if (fromMonth) filters.from_month = parseInt(fromMonth);
  if (intoYear) filters.into_year = parseInt(intoYear);
  if (intoMonth) filters.into_month = parseInt(intoMonth);

  const results = await getCarryForwards(auth.company_id, filters);
  return ok({ results });
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
