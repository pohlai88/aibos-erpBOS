import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CloseSlaService } from "@/services/close/sla";
import { SlaPolicyUpsertSchema } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:board:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code") || "MONTH_END";

    const slaService = new CloseSlaService();
    const result = await slaService.getSlaPolicy(authCtx.company_id, code);

    if (!result) {
        return ok({ error: "SLA policy not found" }, 404);
    }

    return ok(result);
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:board:manage");

    const authCtx = auth as AuthCtx;
    const body = await request.json();

    // Validate request body
    const validatedData = SlaPolicyUpsertSchema.parse(body);

    const slaService = new CloseSlaService();
    const result = await slaService.upsertSlaPolicy(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok(result);
});
