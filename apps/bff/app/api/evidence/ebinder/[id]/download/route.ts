import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { EvidenceVaultService } from "@/services/evidence/vault";
import { ok } from "@/api/_kit";

// GET /api/evidence/ebinder/[id]/download - Download eBinder
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRouteErrors(async () => {
        const auth = await requireAuth(request);
        await requireCapability(auth, "ctrl:evidence");

        const authCtx = auth as AuthCtx;
        const binderId = params.id;

        const service = new EvidenceVaultService();
        const download = await service.getEbinderDownload(authCtx.company_id, binderId);

        return ok(download);
    })();
}
