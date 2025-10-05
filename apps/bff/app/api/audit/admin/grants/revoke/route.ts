import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AuditAdminService } from "@/services/audit/admin";
import { GrantRevoke } from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/audit/admin/grants/revoke - Revoke grant
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "audit:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = GrantRevoke.parse(body);

    const service = new AuditAdminService();
    await service.revokeGrant(validatedData.grant_id, authCtx.user_id);

    return ok({ success: true });
});
