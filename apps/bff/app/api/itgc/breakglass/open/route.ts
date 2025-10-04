import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCBreakglassService } from "@/services/itgc/breakglass";
import { BreakglassOpen, BreakglassClose } from "@aibos/contracts";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:view");

    const authCtx = auth as AuthCtx;
    const breakglassService = new ITGCBreakglassService();
    const activeBreakglass = await breakglassService.getActiveBreakglass(authCtx.company_id);

    return NextResponse.json({
        success: true,
        data: activeBreakglass
    });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:breakglass");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = BreakglassOpen.parse(body);

    const breakglassService = new ITGCBreakglassService();
    const breakglass = await breakglassService.openBreakglass(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return NextResponse.json({
        success: true,
        data: breakglass
    });
});
