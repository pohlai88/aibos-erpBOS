import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCUARService } from "@/services/itgc/uar";
import { CampaignUpsert, CampaignOpen, CampaignDecideItem, CampaignClose } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:view");

    const authCtx = auth as AuthCtx;
    const uarService = new ITGCUARService();
    const campaigns = await uarService.getCampaigns(authCtx.company_id);

    return ok({
            success: true,
            data: campaigns
        });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:campaigns");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = CampaignUpsert.parse(body);

    const uarService = new ITGCUARService();
    const campaign = await uarService.createCampaign(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: true,
            data: campaign
        });
});
