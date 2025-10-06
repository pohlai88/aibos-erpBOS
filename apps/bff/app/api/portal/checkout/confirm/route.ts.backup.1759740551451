import { NextRequest, NextResponse } from 'next/server';
import { ArPortalService } from '@/services/ar/portal';
import { ArCheckoutService } from '@/services/ar/checkout';
import { CheckoutConfirmReq } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const portalService = new ArPortalService();
const checkoutService = new ArCheckoutService();

// POST /api/portal/checkout/confirm - Confirm checkout
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const req = CheckoutConfirmReq.parse(body);

    // Company context resolved from checkout intent in service
    const result = await checkoutService.confirmIntent(
      'checkout-confirm', // Company ID resolved from intent in service processing
      req
    );

    return ok(result);
  } catch (error) {
    console.error('Checkout confirm error:', error);
    return ok({ error: 'Failed to confirm checkout' }, 500);
  }
});
