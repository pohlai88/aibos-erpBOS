import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  upsertTaxPartner,
  getTaxPartners,
} from '@/services/tax_return/templates';
import { TaxPartnerUpsert } from '@aibos/contracts';

// GET /api/tax/partners - List tax partners
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const partners = await getTaxPartners(auth.company_id);
  return ok(partners);
});

// POST /api/tax/partners - Create or update tax partner
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxPartnerUpsert.parse(json);

  const result = await upsertTaxPartner(auth.company_id, input, auth.user_id);
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
