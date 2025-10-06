import { NextRequest, NextResponse } from 'next/server';
import { ArCheckoutService } from '@/services/ar/checkout';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

const checkoutService = new ArCheckoutService();

// GET /api/ar/checkout/intents - List checkout intents
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:portal:ops');
    if (cap instanceof Response) return cap;

    // TODO: Implement listIntents method in ArCheckoutService
    const intents: any[] = [];

    return ok(intents);
  } catch (error) {
    console.error('Checkout intents error:', error);
    return ok({ error: 'Failed to list checkout intents' }, 500);
  }
});
