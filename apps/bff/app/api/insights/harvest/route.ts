import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { InsightsHarvestService } from "@/services/insights/harvest";
import { InsightsBenchmarksService } from "@/services/insights/benchmarks";
import { InsightsAnomalyService } from "@/services/insights/anomaly";
import { InsightsExportService } from "@/services/insights/export";
import {
    InsightsQuery,
    BenchSeedReq,
    TargetUpsert,
    RecoAction,
    ExportReq
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/insights/harvest - Harvest facts from close runs
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "insights:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const runId = body.run_id;

    const service = new InsightsHarvestService();
    const result = await service.harvestFacts(authCtx.company_id, runId);

    return ok(result);
});
