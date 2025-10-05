import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CertificationsService } from "@/services/controls/certs";
import { CertSignReq, CertSignQuery } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "cert:report");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const { searchParams } = new URL(request.url);
    const query = CertSignQuery.parse({
        run_id: searchParams.get("run_id") || undefined,
        level: searchParams.get("level") as any || undefined,
        signer_role: searchParams.get("signer_role") as any || undefined,
        signed_from: searchParams.get("signed_from") || undefined,
        signed_to: searchParams.get("signed_to") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new CertificationsService();
    const signoffs = await service.queryCertSignoffs(authCtx.company_id, query);

    return ok({ signoffs });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "cert:sign");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const validatedData = CertSignReq.parse(body);

    const service = new CertificationsService();
    const signoff = await service.signCertification(
        authCtx.company_id,
        authCtx.user_id,
        validatedData
    );

    return ok({ signoff });
});
