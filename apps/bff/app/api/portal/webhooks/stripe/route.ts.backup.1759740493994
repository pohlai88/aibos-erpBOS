import { NextRequest, NextResponse } from 'next/server';
import { ArPortalService } from '@/services/ar/portal';
import { ArWebhookService } from '@/services/ar/webhook';
import type { GatewayWebhookReqType } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const portalService = new ArPortalService();
const webhookService = new ArWebhookService();

// POST /api/portal/webhooks/stripe - Stripe webhook
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const signature = request.headers.get('stripe-signature') || '';

    const req: GatewayWebhookReqType = {
      gateway: 'STRIPE',
      payload: body,
      signature,
      timestamp: Date.now(),
    };

    const result = await webhookService.processWebhook(
      'webhook-processing', // Company ID resolved from checkout intent in webhook processing
      req
    );

    return ok(result);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return ok({ error: 'Webhook processing failed' }, 500);
  }
});
