import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { SOXDeficienciesService } from "@/services/sox/deficiencies";
import { DeficiencyUpdate, DeficiencyLinkUpsert } from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/sox/deficiencies/update - Update deficiency
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:deficiency");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = DeficiencyUpdate.parse(body);

    const service = new SOXDeficienciesService();
    const result = await service.updateDeficiency(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ result });
});

// POST /api/sox/deficiencies/link - Link deficiency to source
export const PUT = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:deficiency");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = DeficiencyLinkUpsert.parse(body);

    const service = new SOXDeficienciesService();
    await service.linkDeficiency(authCtx.company_id, validatedData);

    return ok({ result: { success: true } });
});
