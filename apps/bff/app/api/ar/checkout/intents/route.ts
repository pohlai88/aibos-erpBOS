import { NextRequest, NextResponse } from "next/server";
import { ArCheckoutService } from "@/services/ar/checkout";
import { requireAuth, requireCapability } from "@/lib/auth";

const checkoutService = new ArCheckoutService();

// GET /api/ar/checkout/intents - List checkout intents
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:portal:ops");
        if (cap instanceof Response) return cap;

        // TODO: Implement listIntents method in ArCheckoutService
        const intents: any[] = [];

        return NextResponse.json(intents);
    } catch (error) {
        console.error('Checkout intents error:', error);
        return NextResponse.json(
            { error: 'Failed to list checkout intents' },
            { status: 500 }
        );
    }
}