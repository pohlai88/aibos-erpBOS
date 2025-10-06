import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  upsertTaxTemplate,
  getTaxTemplate,
} from '@/services/tax_return/templates';
import { TaxTemplateUpsert } from '@aibos/contracts';

// GET /api/tax/templates - Get tax template
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const partnerCode = url.searchParams.get('partner_code');
  const version = url.searchParams.get('version');

  if (!partnerCode || !version) {
    return badRequest('partner_code and version are required');
  }

  const template = await getTaxTemplate(auth.company_id, partnerCode, version);
  return ok(template);
});

// POST /api/tax/templates - Create or update tax template
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxTemplateUpsert.parse(json);

  const result = await upsertTaxTemplate(auth.company_id, input, auth.user_id);
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
