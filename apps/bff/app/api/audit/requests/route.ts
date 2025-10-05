import { NextRequest, NextResponse } from "next/server";
import { withRouteErrors } from "@/lib/route-utils";
import { AuditPbcService } from "@/services/audit/pbc";
import { PbcOpen, RequestQuery } from "@aibos/contracts";
import { ok } from "@/api/_kit";

// POST /api/audit/requests - Open PBC request
export const POST = withRouteErrors(async (request: NextRequest) => {
    // Extract auditor session info from headers
    const auditorId = request.headers.get("x-auditor-id") || "unknown";
    const companyId = request.headers.get("x-company-id") || "default";

    const body = await request.json();
    const validatedData = PbcOpen.parse(body);

    const service = new AuditPbcService();
    const requestResult = await service.openRequest(companyId, auditorId, validatedData);

    return ok({ request: requestResult });
});

// GET /api/audit/requests - Query PBC requests
export const GET = withRouteErrors(async (request: NextRequest) => {
    // Extract auditor session info from headers
    const auditorId = request.headers.get("x-auditor-id") || "unknown";
    const companyId = request.headers.get("x-company-id") || "default";

    const { searchParams } = new URL(request.url);
    const query = RequestQuery.parse({
        auditor_id: searchParams.get("auditor_id") || auditorId,
        state: searchParams.get("state") as any || undefined,
        due_after: searchParams.get("due_after") || undefined,
        due_before: searchParams.get("due_before") || undefined,
        limit: parseInt(searchParams.get("limit") || "50"),
        offset: parseInt(searchParams.get("offset") || "0")
    });

    const service = new AuditPbcService();
    const requests = await service.queryRequests(companyId, query);

    return ok({ requests });
});
