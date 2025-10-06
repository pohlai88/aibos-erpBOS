import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { createIcMatch, getIcMatches } from '@/services/consol/ic';
import { IcMatchCreate } from '@aibos/contracts';

// GET /api/ic/match - List IC matches
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const groupCode = url.searchParams.get('group_code');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  if (!groupCode || !year || !month) {
    return unprocessable('group_code, year, and month parameters are required');
  }

  const matches = await getIcMatches(
    auth.company_id,
    groupCode,
    parseInt(year),
    parseInt(month)
  );
  return ok(matches);
});

// POST /api/ic/match - Create IC match
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = IcMatchCreate.parse(json);

  const result = await createIcMatch(auth.company_id, input, auth.user_id);
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
