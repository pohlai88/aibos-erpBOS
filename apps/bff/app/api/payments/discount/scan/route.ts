import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { DiscountScanReq } from '@aibos/contracts';
import { scanDiscountCandidates } from '@/services/payments/discount';

// POST /api/payments/discount/scan - Scan for discount candidates
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'pay:discount:run');
  if (forbiddenCheck) return forbiddenCheck;

  const body = await req.json();
  const validated = DiscountScanReq.safeParse(body);

  if (!validated.success) {
    return unprocessable(validated.error.message);
  }

  const run = await scanDiscountCandidates(
    auth.company_id,
    validated.data,
    auth.user_id
  );

  return ok({ run });
});
