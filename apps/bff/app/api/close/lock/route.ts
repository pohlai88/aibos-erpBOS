import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CloseOrchestratorService } from "@/services/close/orchestrator";
import { CloseLockRequest } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:manage");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const data = CloseLockRequest.parse(body);

    const service = new CloseOrchestratorService();
    const lock = await service.lockEntity(authCtx.company_id, authCtx.user_id, data);

    return ok({ lock });
});
