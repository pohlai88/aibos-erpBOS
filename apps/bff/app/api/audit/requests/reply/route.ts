import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AuditPbcService } from "@/services/audit/pbc";
import { PbcReply } from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/audit/requests/reply - Reply to PBC request
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "audit:respond");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = PbcReply.parse(body);

    const service = new AuditPbcService();
    const requestResult = await service.reply(authCtx.company_id, authCtx.user_id, validatedData);

    return ok({ request: requestResult });
});
