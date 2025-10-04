import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AlertsService } from "@/services/opscc";

// POST /api/opscc/alerts/fire - Manually evaluate alert rules
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "opscc:admin");

    const authCtx = auth as AuthCtx;
    const service = new AlertsService();

    await service.fireAlerts(authCtx.company_id);

    return NextResponse.json({
        success: true,
        message: "Alert rules evaluated successfully"
    });
});
