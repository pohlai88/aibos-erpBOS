import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CloseOrchestratorService } from "@/services/close/orchestrator";
import { CloseTaskAction } from "@aibos/contracts";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:run");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const data = CloseTaskAction.parse(body);

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("task_id");
    if (!taskId) {
        return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    const service = new CloseOrchestratorService();
    await service.performTaskAction(authCtx.company_id, taskId, authCtx.user_id, data);

    return NextResponse.json({ success: true });
});
