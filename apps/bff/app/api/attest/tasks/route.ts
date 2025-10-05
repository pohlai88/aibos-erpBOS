import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AttestTasksService } from "@/services/attest";
import { TaskQuerySchema } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "attest:respond");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams = {
        campaignId: searchParams.get("campaignId") || undefined,
        assigneeId: searchParams.get("assigneeId") || undefined,
        state: searchParams.get("state")?.split(",").filter(Boolean),
        slaState: searchParams.get("slaState")?.split(",").filter(Boolean),
        scopeKey: searchParams.get("scopeKey")?.split(",").filter(Boolean),
        limit: parseInt(searchParams.get("limit") || "100"),
        offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Validate query parameters
    const validatedQuery = TaskQuerySchema.parse(queryParams);

    const tasksService = new AttestTasksService();
    const result = await tasksService.listTasks(authCtx.company_id, validatedQuery);

    return ok(result);
});
