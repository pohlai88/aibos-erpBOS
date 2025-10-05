import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCEvidenceService } from "@/services/itgc/evidence";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:view");

    const authCtx = auth as AuthCtx;
    const evidenceService = new ITGCEvidenceService();

    const [snapshots, packs] = await Promise.all([
        evidenceService.getSnapshots(authCtx.company_id),
        evidenceService.getUARPacks(authCtx.company_id)
    ]);

    return ok({
            success: true,
            data: {
                snapshots,
                packs
            }
        });
});
