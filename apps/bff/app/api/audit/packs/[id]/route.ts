import { NextRequest, NextResponse } from "next/server";
import { withRouteErrors } from "@/lib/route-utils";
import { AuditWorkspaceService } from "@/services/audit/workspace";
import { PackViewReq } from "@aibos/contracts";
import { ok } from "@/api/_kit";

// GET /api/audit/packs/[id] - Get pack details
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => {
    // Extract auditor session info from headers
    const auditorId = request.headers.get("x-auditor-id") || "unknown";
    const companyId = request.headers.get("x-company-id") || "default";

    const validatedData = PackViewReq.parse({ id: params.id });

    const service = new AuditWorkspaceService();
    const pack = await service.getPack(companyId, auditorId, validatedData.id);

    return ok({ pack });
});
