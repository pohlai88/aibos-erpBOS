import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { EvidenceVaultService } from "@/services/evidence/vault";
import {
    EvidenceManifestUpsert,
    EvidenceManifestQuery,
    EvidenceItemAdd,
    EvidenceItemQuery,
    EbinderGenerate,
    EbinderQuery,
    EvidenceAttestationAdd,
    EvidenceAttestationQuery
} from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/evidence/manifests - Query evidence manifests
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:evidence");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const query = EvidenceManifestQuery.parse({
        control_id: searchParams.get("control_id") || undefined,
        run_id: searchParams.get("run_id") || undefined,
        task_id: searchParams.get("task_id") || undefined,
        bundle_type: searchParams.get("bundle_type") as any || undefined,
        status: searchParams.get("status") as any || undefined,
        created_from: searchParams.get("created_from") || undefined,
        created_to: searchParams.get("created_to") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new EvidenceVaultService();
    const manifests = await service.queryEvidenceManifests(authCtx.company_id, query);

    return ok({ manifests });
});

// POST /api/evidence/manifests - Create evidence manifest
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:manage");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const data = EvidenceManifestUpsert.parse(body);

    const service = new EvidenceVaultService();
    const manifest = await service.createEvidenceManifest(
        authCtx.company_id,
        authCtx.user_id,
        data
    );

    return ok({ manifest });
});
