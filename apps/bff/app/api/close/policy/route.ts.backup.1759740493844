import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ClosePolicyService } from '@/services/close/policy';
import { ClosePolicyUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const service = new ClosePolicyService();
  const policy = await service.getClosePolicy(authCtx.company_id);

  return ok({ policy });
});

export const PUT = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:manage');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = ClosePolicyUpsert.parse(body);

  const service = new ClosePolicyService();
  const policy = await service.upsertClosePolicy(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ policy });
});
