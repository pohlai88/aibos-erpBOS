import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AuditAdminService } from "@/services/audit/admin";
import {
    AuditorUpsert,
    GrantUpsert,
    GrantRevoke,
    AuditorQuery,
    GrantQuery
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/audit/admin/auditors - Create or update auditor
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "audit:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = AuditorUpsert.parse(body);

    const service = new AuditAdminService();
    const auditor = await service.upsertAuditor(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ auditor });
});

// GET /api/audit/admin/auditors - Query auditors
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "audit:admin");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const query = AuditorQuery.parse({
        status: searchParams.get("status") as any || undefined,
        email: searchParams.get("email") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new AuditAdminService();
    const auditors = await service.queryAuditors(authCtx.company_id, query);

    return ok({ auditors });
});
