import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { upsertGroup, getGroups } from '@/services/consol/entities';
import { GroupUpsert } from '@aibos/contracts';

// GET /api/consol/groups - List groups
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:read');
  if (forbiddenCheck) return forbiddenCheck;

  const groups = await getGroups(auth.company_id);
  return ok(groups);
});

// POST /api/consol/groups - Create or update group
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = GroupUpsert.parse(json);

  const result = await upsertGroup(auth.company_id, input);
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
