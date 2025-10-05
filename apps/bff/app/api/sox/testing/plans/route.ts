import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { SOXTestingService } from "@/services/sox/testing";
import {
    TestPlanUpsert,
    TestPlanApprove,
    SampleUpsert,
    TestResultUpsert,
    SOXQueryParams
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/sox/testing/plans - List test plans
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:test.plan");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const params = SOXQueryParams.parse({
        period: searchParams.get("period") || undefined,
        process: searchParams.get("process") as any || undefined,
        limit: parseInt(searchParams.get("limit") || "100"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new SOXTestingService();
    const result = await service.listTestPlans(authCtx.company_id, params);

    return ok({ result });
});

// POST /api/sox/testing/plans - Create test plan
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:test.plan");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = TestPlanUpsert.parse(body);

    const service = new SOXTestingService();
    const result = await service.createTestPlan(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ result });
});
