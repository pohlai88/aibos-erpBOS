import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCRegistryService } from "@/services/itgc/registry";
import { SystemUpsert, ConnectorUpsert } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:view");

    const authCtx = auth as AuthCtx;
    const registryService = new ITGCRegistryService();

    const systems = await registryService.getSystems(authCtx.company_id);

    return ok({
            success: true,
            data: systems
        });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = SystemUpsert.parse(body);

    const registryService = new ITGCRegistryService();
    const system = await registryService.upsertSystem(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: true,
            data: system
        });
});
