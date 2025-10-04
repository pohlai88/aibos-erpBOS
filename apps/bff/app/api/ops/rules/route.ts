import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { OpsRuleEngine } from "@/services";
import {
    RuleUpsert,
    RuleTestRequest
} from "@aibos/contracts";

// GET /api/ops/rules - Get rules
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:rules:admin");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get("enabled");
    const severity = searchParams.get("severity");

    const service = new OpsRuleEngine();

    // TODO: Implement getRules method
    const rules: any[] = []; // Placeholder

    return NextResponse.json({ rules });
});

// POST /api/ops/rules - Create or update rule
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:rules:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = RuleUpsert.parse(body);

    const service = new OpsRuleEngine();
    const rule = await service.upsertRule(authCtx.company_id, authCtx.user_id, validatedData);

    return NextResponse.json({ rule });
});

// POST /api/ops/rules/test - Test rule against historical signals
export const PUT = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:rules:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = RuleTestRequest.parse(body);

    const service = new OpsRuleEngine();
    const result = await service.testRule(authCtx.company_id, validatedData);

    return NextResponse.json({ result });
});
