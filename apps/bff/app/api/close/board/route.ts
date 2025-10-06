import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CloseBoardService } from '@/services/close/board';
import { CloseItemQuerySchema, CloseItemUpsertSchema } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:board:view');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const queryParams = {
    period: searchParams.get('period') || undefined,
    process: searchParams.get('process')?.split(',').filter(Boolean),
    status: searchParams.get('status')?.split(',').filter(Boolean),
    ownerId: searchParams.get('ownerId') || undefined,
    slaState: searchParams.get('slaState')?.split(',').filter(Boolean),
    kind: searchParams.get('kind')?.split(',').filter(Boolean),
    limit: parseInt(searchParams.get('limit') || '100'),
    offset: parseInt(searchParams.get('offset') || '0'),
  };

  // Validate query parameters
  const validatedQuery = CloseItemQuerySchema.parse(queryParams);

  const boardService = new CloseBoardService();
  const result = await boardService.listBoard(
    authCtx.company_id,
    validatedQuery
  );

  return ok(result);
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:board:manage');

  const authCtx = auth as AuthCtx;
  const body = await request.json();

  // Validate request body
  const validatedData = CloseItemUpsertSchema.parse(body);

  const boardService = new CloseBoardService();
  const result = await boardService.upsertItem(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok(result);
});
