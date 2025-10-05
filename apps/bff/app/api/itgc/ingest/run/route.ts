import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ITGCIngestService } from "@/services/itgc/ingest";
import { IngestRunReq } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "itgc:ingest");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = IngestRunReq.parse(body);

    const ingestService = new ITGCIngestService();
    const result = await ingestService.runIngestion(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({
            success: result.success,
            data: result
        });
});
