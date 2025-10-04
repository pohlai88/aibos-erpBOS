import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { SOXTestingService } from "@/services/sox/testing";
import { TestPlanApprove } from "@aibos/contracts";

// POST /api/sox/testing/plans/approve - Approve test plan
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:test.plan");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = TestPlanApprove.parse(body);

    const service = new SOXTestingService();
    const result = await service.approveTestPlan(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return NextResponse.json({ result });
});
