import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { createIcLink, getIcLinks } from '@/services/consol/ic';
import { IcLinkCreate } from '@aibos/contracts';

// GET /api/ic/link - List IC links
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const entityCode = url.searchParams.get('entity_code');
  const coEntityCp = url.searchParams.get('co_entity_cp');

  const links = await getIcLinks(
    auth.company_id,
    entityCode || undefined,
    coEntityCp || undefined
  );
  return ok(links);
});

// POST /api/ic/link - Create IC link
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = IcLinkCreate.parse(json);

  const result = await createIcLink(auth.company_id, input);
  return ok(result);
});

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
