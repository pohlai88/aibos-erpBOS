import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { ArCheckoutService } from "@/services/ar/checkout";
import { CheckoutConfirmReq } from "@aibos/contracts";

const portalService = new ArPortalService();
const checkoutService = new ArCheckoutService();

// POST /api/portal/checkout/confirm - Confirm checkout
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const req = CheckoutConfirmReq.parse(body);

        const result = await checkoutService.confirmIntent(
            'default-company', // TODO: Get from context
            req
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Checkout confirm error:', error);
        return NextResponse.json(
            { error: 'Failed to confirm checkout' },
            { status: 500 }
        );
    }
}