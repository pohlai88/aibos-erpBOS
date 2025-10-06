import { NextRequest, NextResponse } from 'next/server';
import { ArStatementService } from '@/services/ar/statements';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import {
  FinanceChargePolicyUpsert,
  StatementRunReq,
  StatementEmailReq,
} from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const statementService = new ArStatementService();

// GET /api/ar/finance-charge/policy - Get finance charge policy
// POST /api/ar/finance-charge/policy - Update finance charge policy
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:stmt:policy');
    if (cap instanceof Response) return cap;

    const policy = await statementService.getFinanceChargePolicy(
      auth.company_id
    );

    if (!policy) {
      return ok({
        enabled: false,
        annual_pct: 0,
        min_fee: 0,
        grace_days: 0,
        comp_method: 'simple',
      });
    }

    return ok(policy);
  } catch (error) {
    console.error('Finance charge policy error:', error);
    return serverError('Failed to get finance charge policy');
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:stmt:policy');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedBody = FinanceChargePolicyUpsert.parse(body);

    const result = await statementService.upsertFinanceChargePolicy(
      auth.company_id,
      validatedBody,
      auth.user_id
    );

    return ok(result);
  } catch (error) {
    console.error('Finance charge policy update error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid request body', error);
    }
    return serverError('Failed to update finance charge policy');
  }
});
