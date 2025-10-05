import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCSoDService } from "@/services/itgc/sod";
import { SoDRuleUpsert, SoDQuery, ViolationAction } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const queryData = {
        company_id: authCtx.company_id,
        system_id: searchParams.get("system_id") || undefined,
        user_id: searchParams.get("user_id") || undefined,
        status: searchParams.get("status") as any || undefined,
        severity: searchParams.get("severity") as any || undefined,
        paging: {
            limit: parseInt(searchParams.get("limit") || "50"),
            offset: parseInt(searchParams.get("offset") || "0")
        }
    };

    const validatedQuery = SoDQuery.parse(queryData);
    const sodService = new ITGCSoDService();
    const violations = await sodService.getSoDViolations(validatedQuery);

    return ok({
            success: true,
            data: violations
        });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = SoDRuleUpsert.parse(body);

    const sodService = new ITGCSoDService();
    const rule = await sodService.upsertSoDRule(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: true,
            data: rule
        });
});
