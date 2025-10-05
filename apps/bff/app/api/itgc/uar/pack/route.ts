import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCEvidenceService } from "@/services/itgc/evidence";
import { PackBuildReq } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:campaigns");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = PackBuildReq.parse(body);

    const evidenceService = new ITGCEvidenceService();
    const pack = await evidenceService.buildUARPack(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: true,
            data: pack
        });
});
