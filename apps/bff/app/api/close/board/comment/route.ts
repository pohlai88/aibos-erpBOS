import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CloseBoardService } from '@/services/close/board';
import { CloseCommentCreateSchema } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:board:manage');

  const authCtx = auth as AuthCtx;
  const body = await request.json();

  // Validate request body
  const validatedData = CloseCommentCreateSchema.parse(body);

  const boardService = new CloseBoardService();
  const result = await boardService.addComment(authCtx.user_id, validatedData);

  return ok(result);
});
