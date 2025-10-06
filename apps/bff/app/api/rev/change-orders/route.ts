import { NextRequest, NextResponse } from 'next/server';
import { RevModificationService } from '@/services/rb/modifications';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import {
  ChangeOrderCreate,
  ChangeOrderQuery,
  ChangeOrderQueryType,
} from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const modificationService = new RevModificationService();

// POST /api/rev/change-orders - Create change order
// GET /api/rev/change-orders - List change orders
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:modify');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = ChangeOrderCreate.parse(body);

    const result = await modificationService.createChangeOrder(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    console.error('Error creating change order:', error);
    return serverError('Failed to create change order');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:modify');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query: ChangeOrderQueryType = {
      contract_id: url.searchParams.get('contract_id') || undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      type: (url.searchParams.get('type') as any) || undefined,
      effective_date_from:
        url.searchParams.get('effective_date_from') || undefined,
      effective_date_to: url.searchParams.get('effective_date_to') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const result = await modificationService.queryChangeOrders(
      auth.company_id,
      query
    );
    return ok(result);
  } catch (error) {
    console.error('Error listing change orders:', error);
    return serverError('Failed to list change orders');
  }
});
