import { NextRequest, NextResponse } from "next/server";
import { ArWebhookService } from "@/services/ar/webhook";
import type { GatewayWebhookReqType } from "@aibos/contracts";

const webhookService = new ArWebhookService();

// POST /api/portal/webhooks/paypal - PayPal webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const signature = request.headers.get('paypal-signature') || '';

        const req: GatewayWebhookReqType = {
            gateway: 'PAYPAL',
            payload: body,
            signature,
            timestamp: Date.now()
        };

        const result = await webhookService.processWebhook(
            'webhook-processing', // Company ID resolved from checkout intent in webhook processing
            req
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('PayPal webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}