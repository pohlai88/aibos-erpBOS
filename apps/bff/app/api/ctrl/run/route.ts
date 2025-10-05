import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ControlsRunnerService } from "@/services/controls/runner";
import { ControlRunRequest, ControlRunQuery } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:report");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const { searchParams } = new URL(request.url);
    const query = ControlRunQuery.parse({
        control_id: searchParams.get("control_id") || undefined,
        assignment_id: searchParams.get("assignment_id") || undefined,
        run_id: searchParams.get("run_id") || undefined,
        status: searchParams.get("status") as any || undefined,
        scheduled_from: searchParams.get("scheduled_from") || undefined,
        scheduled_to: searchParams.get("scheduled_to") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new ControlsRunnerService();
    const runs = await service.queryControlRuns(authCtx.company_id, query);

    return ok({ runs });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:run");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const validatedData = ControlRunRequest.parse(body);

    const service = new ControlsRunnerService();
    const run = await service.executeControlRun(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ run });
});
