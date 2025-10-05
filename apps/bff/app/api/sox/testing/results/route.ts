import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { SOXTestingService } from "@/services/sox/testing";
import {
    TestResultUpsert,
    SOXQueryParams
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/sox/testing/results - List test results
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:test.exec");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const params = SOXQueryParams.parse({
        period: searchParams.get("period") || undefined,
        limit: parseInt(searchParams.get("limit") || "100"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new SOXTestingService();
    const result = await service.listTestResults(authCtx.company_id, params);

    return ok({ result });
});

// POST /api/sox/testing/results - Record test result
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:test.exec");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = TestResultUpsert.parse(body);

    const service = new SOXTestingService();
    const result = await service.recordTestResult(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ result });
});
