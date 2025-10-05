import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCRegistryService } from "@/services/itgc/registry";
import { ConnectorUpsert } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);
    const systemId = searchParams.get("system_id");

    if (!systemId) {
        return ok({ success: false, error: "system_id parameter is required" }, 400);
    }

    const registryService = new ITGCRegistryService();
    const connectors = await registryService.getConnectors(systemId);

    return ok({
            success: true,
            data: connectors
        });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = ConnectorUpsert.parse(body);

    const registryService = new ITGCRegistryService();
    const connector = await registryService.upsertConnector(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: true,
            data: connector
        });
});
