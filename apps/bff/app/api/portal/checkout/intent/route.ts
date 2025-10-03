import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { ArCheckoutService } from "@/services/ar/checkout";
import { CheckoutIntentReq } from "@aibos/contracts";

const portalService = new ArPortalService();
const checkoutService = new ArCheckoutService();

// POST /api/portal/checkout/intent - Create checkout intent
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const req = CheckoutIntentReq.parse(body);

        // Resolve token to get customer context
        const session = await portalService.resolveToken(req.token);
        if (!session) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const result = await checkoutService.createIntent(
            session.companyId,
            session.customerId,
            req,
            'portal-user'
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Checkout intent error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout intent' },
            { status: 500 }
        );
    }
}