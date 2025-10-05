import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { RevSspAdminService } from "@/services/revenue/ssp-admin";
import {
    SspUpsert,
    SspEvidenceUpsert,
    SspPolicyUpsert,
    SspChangeRequest,
    SspChangeDecision,
    SspQuery
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "rev:ssp");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const { searchParams } = new URL(request.url);
    const query = SspQuery.parse({
        product_id: searchParams.get("product_id") || undefined,
        currency: searchParams.get("currency") || undefined,
        method: searchParams.get("method") as any || undefined,
        status: searchParams.get("status") as any || undefined,
        effective_from: searchParams.get("effective_from") || undefined,
        effective_to: searchParams.get("effective_to") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new RevSspAdminService();
    const catalogs = await service.querySspCatalog(authCtx.company_id, query);

    return ok({ catalogs });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "rev:ssp");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const data = SspUpsert.parse(body);

    const service = new RevSspAdminService();
    const catalog = await service.upsertSspCatalog(authCtx.company_id, authCtx.user_id, data);

    return ok({ catalog });
});
