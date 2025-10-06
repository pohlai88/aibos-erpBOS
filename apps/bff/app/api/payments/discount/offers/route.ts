import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { OfferCreateReq } from '@aibos/contracts';
import { createDiscountOffer } from '@/services/payments/discount';

// POST /api/payments/discount/offers - Create dynamic discount offer
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'pay:discount:offer');
  if (forbiddenCheck) return forbiddenCheck;

  const body = await req.json();
  const validated = OfferCreateReq.safeParse(body);

  if (!validated.success) {
    return unprocessable(validated.error.message);
  }

  const offer = await createDiscountOffer(
    auth.company_id,
    validated.data,
    auth.user_id
  );

  return ok({ offer });
});
