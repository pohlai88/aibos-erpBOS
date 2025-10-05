import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AttestPackService } from "@/services/attest";
import { PackSignReqSchema } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "attest:approve");

    const authCtx = auth as AuthCtx;
    const body = await request.json();

    // Validate request body
    const validatedData = PackSignReqSchema.parse(body);

    const packService = new AttestPackService();
    const result = await packService.buildPack(
        validatedData.taskId,
        authCtx.company_id,
        authCtx.user_id
    );

    return ok(result);
});
