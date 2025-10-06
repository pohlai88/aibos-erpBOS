import { NextRequest, NextResponse } from 'next/server';
import { ArWebhookService } from '@/services/ar/webhook';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

const webhookService = new ArWebhookService();

// POST /api/ar/webhook/retry - Retry failed webhooks
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:portal:ops');
    if (cap instanceof Response) return cap;

    const result = await webhookService.retryFailedWebhooks(auth.company_id);

    return ok(result);
  } catch (error) {
    console.error('Webhook retry error:', error);
    return ok({ error: 'Failed to retry webhooks' }, 500);
  }
});
