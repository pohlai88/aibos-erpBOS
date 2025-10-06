import { NextRequest } from 'next/server';
import { ok, unprocessable } from '@/lib/http';
import { withRouteErrors } from '@/lib/route-utils';
import { OfferDecisionReq } from '@aibos/contracts';
import { decideDiscountOffer } from '@/services/payments/discount';

// POST /api/payments/discount/offers/decision - Accept/decline discount offer
// Note: This endpoint uses token-based auth (no requireAuth needed for supplier access)
export const POST = withRouteErrors(async (req: NextRequest) => {
  const body = await req.json();
  const validated = OfferDecisionReq.safeParse(body);

  if (!validated.success) {
    return unprocessable(validated.error.message);
  }

  const offer = await decideDiscountOffer(validated.data);

  return ok({ offer });
});
