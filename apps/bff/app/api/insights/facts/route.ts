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

// GET /api/insights/facts - Query insights facts
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "insights:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const query = InsightsQuery.parse({
        from: searchParams.get("from") || undefined,
        to: searchParams.get("to") || undefined,
        entity_id: searchParams.get("entity_id") || undefined,
        level: searchParams.get("level") as any || undefined,
        kind: searchParams.get("kind") as any || undefined,
        filters: searchParams.get("filters") || undefined
    });

    const service = new InsightsExportService();
    const stats = await service.getExportStats(authCtx.company_id);

    return ok({
            stats,
            query: {
                from: query.from,
                to: query.to,
                entity_id: query.entity_id,
                level: query.level,
                kind: query.kind,
                filters: query.filters
            }
        });
});
