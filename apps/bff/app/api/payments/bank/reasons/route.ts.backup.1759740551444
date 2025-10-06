import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { ReasonNormUpsert } from '@aibos/contracts';
import { upsertReasonNorm } from '@/services/payments/bank-connect';
import { withRouteErrors, ok } from '@/api/_kit';

// --- Reason Code Normalization Routes -----------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capability = await requireCapability(auth, 'pay:bank_profile');
    if (capability instanceof Response) return capability;

    const body = await req.json();
    const validatedData = ReasonNormUpsert.parse(body);

    const reasonNorm = await upsertReasonNorm(validatedData);

    return ok(reasonNorm, 201);
  } catch (error) {
    console.error('Error upserting reason normalization:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return ok({ error: error.message }, 400);
    }
    return ok({ error: 'Failed to upsert reason normalization' }, 500);
  }
});
