import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { TaxCarryForwardAcceptRequest } from '@aibos/contracts';
import { acceptCarryForward } from '@/services/tax_return/carry_forward';

// POST /api/tax/returns/carry-forward/accept - Accept carry forward
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxCarryForwardAcceptRequest.parse(json);

  const results = await acceptCarryForward(
    input,
    auth.company_id,
    auth.user_id
  );
  return ok({ results });
});

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
