import { NextRequest, NextResponse } from "next/server";
import { ArWebhookService } from "@/services/ar/webhook";
import { ArSurchargeService } from "@/services/ar/surcharge";
import { requireAuth, requireCapability } from "@/lib/auth";

const webhookService = new ArWebhookService();
const surchargeService = new ArSurchargeService();

// GET /api/ar/surcharge/policy - Get surcharge policy
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:credit:policy");
        if (cap instanceof Response) return cap;

        const policy = await surchargeService.getPolicy(auth.company_id);

        return NextResponse.json(policy);
    } catch (error) {
        console.error('Surcharge policy error:', error);
        return NextResponse.json(
            { error: 'Failed to get surcharge policy' },
            { status: 500 }
        );
    }
}

// PUT /api/ar/surcharge/policy - Update surcharge policy
export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:credit:policy");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const result = await surchargeService.updatePolicy(
            auth.company_id,
            body,
            auth.user_id
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Surcharge policy update error:', error);
        return NextResponse.json(
            { error: 'Failed to update surcharge policy' },
            { status: 500 }
        );
    }
}