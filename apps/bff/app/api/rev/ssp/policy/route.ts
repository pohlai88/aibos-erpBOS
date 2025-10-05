import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { RevSspAdminService } from "@/services/revenue/ssp-admin";
import { SspPolicyUpsert } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "rev:ssp");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const service = new RevSspAdminService();
    const policy = await service.getSspPolicy(authCtx.company_id);

    if (!policy) {
        return ok({ policy: null });
    }

    return ok({ policy });
});

export const PUT = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "rev:ssp");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const data = SspPolicyUpsert.parse(body);

    const service = new RevSspAdminService();
    const policy = await service.upsertSspPolicy(authCtx.company_id, authCtx.user_id, data);

    return ok({ policy });
});
