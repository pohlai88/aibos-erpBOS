import { NextRequest, NextResponse } from 'next/server';
import { RevPolicyService } from '@/services/revenue/policy';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { RevPolicyUpsert, RevProdPolicyUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const policyService = new RevPolicyService();

// GET /api/rev/policy - Get revenue policy
// PUT /api/rev/policy - Update revenue policy
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:policy');
    if (cap instanceof Response) return cap;

    const policy = await policyService.getPolicy(auth.company_id);
    return ok(policy);
  } catch (error) {
    console.error('Error getting revenue policy:', error);
    return serverError('Failed to get revenue policy');
  }
});
export const PUT = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:policy');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = RevPolicyUpsert.parse(body);

    const result = await policyService.upsertPolicy(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid policy data');
    }
    console.error('Error updating revenue policy:', error);
    return serverError('Failed to update revenue policy');
  }
});
