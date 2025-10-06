import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  TaxCarryForwardScanRequest,
  TaxCarryForwardProposeRequest,
  TaxCarryForwardAcceptRequest,
} from '@aibos/contracts';
import {
  scanLateEntries,
  proposeCarryForward,
  acceptCarryForward,
  getCarryForwards,
} from '@/services/tax_return/carry_forward';

// POST /api/tax/returns/carry-forward/scan - Scan for late entries
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxCarryForwardScanRequest.parse(json);

  const proposals = await scanLateEntries(input, auth.company_id);
  return ok({ proposals });
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
