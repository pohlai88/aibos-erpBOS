import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AttestCampaignService } from "@/services/attest";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "attest:campaign");

    const authCtx = auth as AuthCtx;
    const body = await request.json();

    const { campaignId } = body;

    if (!campaignId) {
        return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const campaignService = new AttestCampaignService();
    await campaignService.closeCampaign(campaignId, authCtx.company_id, authCtx.user_id);

    return NextResponse.json({ success: true });
});
