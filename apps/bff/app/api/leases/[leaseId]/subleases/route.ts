import { NextRequest, NextResponse } from "next/server";
import { SubleaseBuilder } from "@/services/lease/sublease-builder";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SubleaseCreateReq, SubleaseQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const subleaseBuilder = new SubleaseBuilder();

// POST /api/leases/:leaseId/subleases - Create sublease
// GET /api/leases/:leaseId/subleases - Query subleases for head lease
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { leaseId: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:sublease");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = SubleaseCreateReq.parse({
            ...body,
            headLeaseId: params.leaseId
        });

        const result = await subleaseBuilder.createSublease(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid sublease data");
        }

        console.error("Error creating sublease:", error);
        return serverError("Failed to create sublease");
    } });
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { leaseId: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            headLeaseId: params.leaseId,
            classification: url.searchParams.get('classification') as any || undefined,
            status: url.searchParams.get('status') as any || undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
        };

        const validatedQuery = SubleaseQuery.parse(query);
        const result = await subleaseBuilder.querySubleases(auth.company_id, validatedQuery);
        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying subleases:", error);
        return serverError("Failed to query subleases");
    } });
