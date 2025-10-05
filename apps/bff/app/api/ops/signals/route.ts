import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { OpsSignalService } from "@/services";
import {
    SignalIngestBatch,
    QuerySignals
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/ops/signals/ingest - Ingest batch of signals
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:signals:ingest");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = SignalIngestBatch.parse(body);

    const service = new OpsSignalService();
    const result = await service.ingestSignals(authCtx.company_id, validatedData);

    return ok({
            message: "Signals ingested successfully",
            ingested: result.ingested,
            deduplicated: result.deduplicated
        });
});

// GET /api/ops/signals - Query signals
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:observability:read");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const query = QuerySignals.parse({
        source: searchParams.get("source") || undefined,
        kind: searchParams.get("kind") || undefined,
        kpi: searchParams.get("kpi") || undefined,
        from_ts: searchParams.get("from_ts") || undefined,
        to_ts: searchParams.get("to_ts") || undefined,
        severity: searchParams.get("severity") as any || undefined,
        tags: searchParams.get("tags") ? searchParams.get("tags")!.split(",") : undefined,
        limit: parseInt(searchParams.get("limit") || "100"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new OpsSignalService();
    const signals = await service.querySignals(authCtx.company_id, query);

    return ok({ signals });
});
