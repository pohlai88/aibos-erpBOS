import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { InsightsExportService } from "@/services/insights/export";
import {
    InsightsExportReq
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/insights/export - Export insights data
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "insights:view");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const data = InsightsExportReq.parse(body);

    const service = new InsightsExportService();
    const result = await service.exportData(authCtx.company_id, data);

    return ok(result);
});
