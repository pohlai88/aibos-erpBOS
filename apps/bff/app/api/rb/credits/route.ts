import { NextRequest, NextResponse } from 'next/server';
import { RbCreditsService } from '@/services/rb/credits';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { CreditMemoReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const creditsService = new RbCreditsService();

// GET /api/rb/credits - Get credit memos for a customer
// POST /api/rb/credits - Create credit memo
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:credit');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const customerId = url.searchParams.get('customer_id');

    if (!customerId) {
      return badRequest('customer_id parameter is required');
    }

    const result = await creditsService.getCustomerCreditMemos(
      auth.company_id,
      customerId
    );
    return ok(result);
  } catch (error) {
    console.error('Error listing credit memos:', error);
    return serverError('Failed to list credit memos');
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:credit');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = CreditMemoReq.parse(body);

    const result = await creditsService.createCreditMemo(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid credit memo data');
    }
    console.error('Error creating credit memo:', error);
    return serverError('Failed to create credit memo');
  }
});
