import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { BoardsService } from '@/services/opscc';
import {
  BoardConfigUpsert,
  TileConfigUpsert,
  BoardTypeSchema,
} from '@aibos/contracts';
import { z } from 'zod';
import { ok } from '@/api/_kit';

// GET /api/opscc/boards - Get all board configurations
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:view');

  const authCtx = auth as AuthCtx;
  const service = new BoardsService();
  const boards = await service.getAllBoardConfigs(authCtx.company_id);

  return ok({ boards });
});

// POST /api/opscc/boards - Create or update board configuration
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = BoardConfigUpsert.parse(body);

  const service = new BoardsService();
  const board = await service.upsertBoardConfig(
    authCtx.company_id,
    validatedData
  );

  return ok({ board });
});

// DELETE /api/opscc/boards - Delete board configuration
export const DELETE = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:admin');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const board = BoardTypeSchema.parse(searchParams.get('board'));

  const service = new BoardsService();
  await service.deleteBoardConfig(authCtx.company_id, board);

  return ok({ success: true });
});
