import { NextRequest, NextResponse } from 'next/server';
import { RbContractsService } from '@/services/rb/contracts';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { ContractUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const contractsService = new RbContractsService();

// GET /api/rb/contracts - List contracts for a customer
// POST /api/rb/contracts - Create/update contract
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:contract');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const customerId = url.searchParams.get('customer_id');

    if (!customerId) {
      return badRequest('customer_id parameter is required');
    }

    const result = await contractsService.getCustomerContracts(
      auth.company_id,
      customerId
    );
    return ok(result);
  } catch (error) {
    console.error('Error listing contracts:', error);
    return serverError('Failed to list contracts');
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:contract');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = ContractUpsert.parse(body);

    const result = await contractsService.upsertContract(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid contract data');
    }
    console.error('Error creating contract:', error);
    return serverError('Failed to create contract');
  }
});
