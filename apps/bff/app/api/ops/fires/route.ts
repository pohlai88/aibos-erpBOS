import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { OpsPlaybookEngine } from "@/services";
import {
    FireApprove,
    FireExecute,
    QueryFires
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/ops/fires - Get fires
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:observability:read");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const query = QueryFires.parse({
        rule_id: searchParams.get("rule_id") || undefined,
        status: searchParams.get("status") as any || undefined,
        from_ts: searchParams.get("from_ts") || undefined,
        to_ts: searchParams.get("to_ts") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    // TODO: Implement getFires method
    const fires: any[] = []; // Placeholder

    return ok({ fires });
});

// POST /api/ops/fires/approve - Approve or reject a fire
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:fires:approve");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = FireApprove.parse(body);

    const service = new OpsPlaybookEngine();
    await service.approveFire(authCtx.company_id, authCtx.user_id, validatedData);

    return ok({
            message: `Fire ${validatedData.decision.toLowerCase()}d successfully`,
            fire_id: validatedData.fire_id,
            decision: validatedData.decision
        });
});

// POST /api/ops/fires/execute - Execute a fire
export const PUT = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:actions:execute");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = FireExecute.parse(body);

    const service = new OpsPlaybookEngine();
    const fire = await service.executeFire(authCtx.company_id, authCtx.user_id, validatedData);

    return ok({ fire });
});
