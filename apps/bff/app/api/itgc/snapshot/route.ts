import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCEvidenceService } from "@/services/itgc/evidence";
import { SnapshotReq, PackBuildReq } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = SnapshotReq.parse(body);

    const evidenceService = new ITGCEvidenceService();
    const snapshot = await evidenceService.takeSnapshot(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: true,
            data: snapshot
        });
});
