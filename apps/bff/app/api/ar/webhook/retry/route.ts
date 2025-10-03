import { NextRequest, NextResponse } from "next/server";
import { ArWebhookService } from "@/services/ar/webhook";
import { requireAuth, requireCapability } from "@/lib/auth";

const webhookService = new ArWebhookService();

// POST /api/ar/webhook/retry - Retry failed webhooks
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:portal:ops");
        if (cap instanceof Response) return cap;

        const result = await webhookService.retryFailedWebhooks(auth.company_id);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Webhook retry error:', error);
        return NextResponse.json(
            { error: 'Failed to retry webhooks' },
            { status: 500 }
        );
    }
}