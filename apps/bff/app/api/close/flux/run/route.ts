import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { FluxEngineService } from "@/services/flux/engine";
import { FluxRunReq, FluxQuery } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "flux:run");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const { searchParams } = new URL(request.url);
    const query = FluxQuery.parse({
        run_id: searchParams.get("run_id") || undefined,
        company_id: searchParams.get("company_id") || undefined,
        base_year: searchParams.get("base_year") ? parseInt(searchParams.get("base_year")!) : undefined,
        base_month: searchParams.get("base_month") ? parseInt(searchParams.get("base_month")!) : undefined,
        cmp_year: searchParams.get("cmp_year") ? parseInt(searchParams.get("cmp_year")!) : undefined,
        cmp_month: searchParams.get("cmp_month") ? parseInt(searchParams.get("cmp_month")!) : undefined,
        material_only: searchParams.get("material_only") === "true" ? true : searchParams.get("material_only") === "false" ? false : undefined,
        requires_comment: searchParams.get("requires_comment") === "true" ? true : searchParams.get("requires_comment") === "false" ? false : undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new FluxEngineService();
    const runs = await service.queryFluxRuns(authCtx.company_id, query);

    return ok({ runs });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "flux:run");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const data = FluxRunReq.parse(body);

    const service = new FluxEngineService();
    const run = await service.runFluxAnalysis(authCtx.company_id, authCtx.user_id, data);

    return ok({ run });
});
