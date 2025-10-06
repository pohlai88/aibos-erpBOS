import { NextRequest, NextResponse } from 'next/server';
import { LeaseRegistrationService } from '@/services/lease/registration';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { LeaseUpsert, LeaseQuery, LeaseCashflowRow } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const registrationService = new LeaseRegistrationService();

// POST /api/leases - Create or update lease
// GET /api/leases - Query leases
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:manage');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const { lease_data, cashflows } = body;

    const validatedLeaseData = LeaseUpsert.parse(lease_data);
    const validatedCashflows = LeaseCashflowRow.array().parse(cashflows);

    const leaseId = await registrationService.upsertLease(
      auth.company_id,
      auth.user_id,
      validatedLeaseData,
      validatedCashflows
    );

    return ok({ lease_id: leaseId });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid lease data');
    }
    console.error('Error creating lease:', error);
    return serverError('Failed to create lease');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:read');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query = {
      asset_class: (url.searchParams.get('asset_class') as any) || undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      commence_from: url.searchParams.get('commence_from') || undefined,
      commence_to: url.searchParams.get('commence_to') || undefined,
      lessor: url.searchParams.get('lessor') || undefined,
      limit: url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : 50,
      offset: url.searchParams.get('offset')
        ? parseInt(url.searchParams.get('offset')!)
        : 0,
    };

    const validatedQuery = LeaseQuery.parse(query);
    const result = await registrationService.queryLeases(
      auth.company_id,
      validatedQuery
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying leases:', error);
    return serverError('Failed to query leases');
  }
});
