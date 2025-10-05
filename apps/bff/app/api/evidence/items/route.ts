import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { EvidenceVaultService } from "@/services/evidence/vault";
import { EvidenceItemAdd } from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/evidence/items - Add evidence item to manifest
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:manage");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const data = EvidenceItemAdd.parse(body);

    const service = new EvidenceVaultService();
    const item = await service.addEvidenceItem(
        authCtx.company_id,
        authCtx.user_id,
        data
    );

    return ok({ item });
});
