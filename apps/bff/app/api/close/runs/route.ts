import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CloseOrchestratorService } from "@/services/close/orchestrator";
import {
    CloseRunCreate,
    CloseRunQuery,
    CloseTaskUpsert,
    CloseTaskAction,
    CloseTaskQuery,
    CloseEvidenceAdd,
    CloseEvidenceQuery,
    CloseLockRequest,
    KpiQuery
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:report");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const { searchParams } = new URL(request.url);
    const query = CloseRunQuery.parse({
        year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined,
        month: searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined,
        status: searchParams.get("status") as any || undefined,
        owner: searchParams.get("owner") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new CloseOrchestratorService();
    const runs = await service.queryCloseRuns(authCtx.company_id, query);

    return ok({ runs });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:run");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const data = CloseRunCreate.parse(body);

    const service = new CloseOrchestratorService();
    const run = await service.createCloseRun(authCtx.company_id, authCtx.user_id, data);

    return ok({ run });
});
