import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { BoardsService } from "@/services/opscc";
import {
    TileConfigUpsert,
    BoardTypeSchema
} from "@aibos/contracts";
import { z } from "zod";
import { ok } from "@/api/_kit";

const TileOrderUpdateSchema = z.object({
    tile_orders: z.array(z.object({
        tile_id: z.string(),
        order_no: z.number().int().nonnegative()
    }))
});

// GET /api/opscc/tiles - Get tile configurations
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "opscc:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const board = searchParams.get("board");

    const service = new BoardsService();

    if (board) {
        const boardType = BoardTypeSchema.parse(board);
        const tiles = await service.getTileConfigs(authCtx.company_id, boardType);
        return ok({ tiles });
    } else {
        const tiles = await service.getAllTileConfigs(authCtx.company_id);
        return ok({ tiles });
    }
});

// POST /api/opscc/tiles - Create or update tile configuration
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "opscc:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = TileConfigUpsert.parse(body);

    const service = new BoardsService();
    const tile = await service.upsertTileConfig(
        authCtx.company_id,
        validatedData
    );

    return ok({ tile });
});

// PATCH /api/opscc/tiles - Update tile order
export const PATCH = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "opscc:admin");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const board = BoardTypeSchema.parse(searchParams.get("board"));
    const body = await request.json();
    const validatedData = TileOrderUpdateSchema.parse(body);

    const service = new BoardsService();
    await service.updateTileOrder(
        authCtx.company_id,
        board,
        validatedData.tile_orders
    );

    return ok({ success: true });
});

// DELETE /api/opscc/tiles - Delete tile configuration
export const DELETE = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "opscc:admin");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const board = BoardTypeSchema.parse(searchParams.get("board"));
    const tileId = z.string().parse(searchParams.get("tile_id"));

    const service = new BoardsService();
    await service.deleteTileConfig(authCtx.company_id, board, tileId);

    return ok({ success: true });
});
