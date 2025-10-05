import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { SOXDeficienciesService } from "@/services/sox/deficiencies";
import {
    DeficiencyUpsert,
    DeficiencyUpdate,
    DeficiencyLinkUpsert,
    SOXQueryParams
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/sox/deficiencies - List deficiencies
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:deficiency");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const params = SOXQueryParams.parse({
        period: searchParams.get("period") || undefined,
        severity: searchParams.get("severity") as any || undefined,
        status: searchParams.get("status") || undefined,
        limit: parseInt(searchParams.get("limit") || "100"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new SOXDeficienciesService();
    const result = await service.listDeficiencies(authCtx.company_id, params);

    return ok({ result });
});

// POST /api/sox/deficiencies - Create deficiency
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:deficiency");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = DeficiencyUpsert.parse(body);

    const service = new SOXDeficienciesService();
    const result = await service.createDeficiency(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ result });
});
