import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { InsightsAnomalyService } from "@/services/insights/anomaly";
import {
    RecoAction
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/insights/reco - Get recommendations
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "insights:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const service = new InsightsAnomalyService();
    const recommendations = await service.getRecommendations(authCtx.company_id, status);

    return ok({ recommendations });
});

// POST /api/insights/reco - Action on recommendations
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "insights:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const data = RecoAction.parse(body);

    const service = new InsightsAnomalyService();
    await service.actionRecommendation(authCtx.company_id, authCtx.user_id, data);

    return ok({ success: true, message: "Recommendation actioned successfully" });
});
