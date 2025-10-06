import { NextRequest, NextResponse } from 'next/server';
import { RbBillingService } from '@/services/rb/billing';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { InvoiceQuery } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const billingService = new RbBillingService();

// GET /api/rb/invoices - List invoices
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:invoice:run');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query = {
      customer_id: url.searchParams.get('customer_id') || undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      period_start: url.searchParams.get('period_start') || undefined,
      period_end: url.searchParams.get('period_end') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const result = await billingService.getInvoices(auth.company_id, query);
    return ok(result);
  } catch (error) {
    console.error('Error listing invoices:', error);
    return serverError('Failed to list invoices');
  }
});
