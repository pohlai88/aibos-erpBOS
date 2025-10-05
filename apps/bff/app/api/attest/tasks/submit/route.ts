import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AttestTasksService } from "@/services/attest";
import { TaskSubmitSchema } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "attest:respond");

    const authCtx = auth as AuthCtx;
    const body = await request.json();

    // Validate request body
    const validatedData = TaskSubmitSchema.parse(body);

    const tasksService = new AttestTasksService();
    await tasksService.submitTask(
        validatedData.taskId,
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ success: true });
});
