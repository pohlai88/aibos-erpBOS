import { NextRequest, NextResponse } from "next/server";
import { ArWebhookService } from "@/services/ar/webhook";
import type { GatewayWebhookReqType } from "@aibos/contracts";

const webhookService = new ArWebhookService();

// POST /api/portal/webhooks/adyen - Adyen webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const signature = request.headers.get('adyen-signature') || '';

        const req: GatewayWebhookReqType = {
            gateway: 'ADYEN',
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
        console.error('Adyen webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}