import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { ArWebhookService } from "@/services/ar/webhook";
import type { GatewayWebhookReqType } from "@aibos/contracts";

const portalService = new ArPortalService();
const webhookService = new ArWebhookService();

// POST /api/portal/webhooks/stripe - Stripe webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const signature = request.headers.get('stripe-signature') || '';

        const req: GatewayWebhookReqType = {
            gateway: 'STRIPE',
            payload: body,
            signature,
            timestamp: Date.now()
        };

        const result = await webhookService.processWebhook(
            'default-company', // TODO: Get from context
            req
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Stripe webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}