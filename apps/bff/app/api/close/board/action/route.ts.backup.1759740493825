import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CloseActionsService } from '@/services/close/actions';
import { CloseBulkActionSchema } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:board:manage');

  const authCtx = auth as AuthCtx;
  const body = await request.json();

  // Validate request body
  const validatedData = CloseBulkActionSchema.parse(body);

  const actionsService = new CloseActionsService();
  const result = await actionsService.applyAction(
    authCtx.user_id,
    validatedData
  );

  return ok(result);
});
