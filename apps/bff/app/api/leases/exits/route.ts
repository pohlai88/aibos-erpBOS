import { NextRequest, NextResponse } from "next/server";
import { LeaseExitService } from "@/services/lease/exit";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseExitUpsert, LeaseExitQuery, LeaseExitPostReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const exitService = new LeaseExitService();

// POST /api/leases/exits - Create or update lease exit
// GET /api/leases/exits - Query exits
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:exit:prepare");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = LeaseExitUpsert.parse(body);

        const exitId = await exitService.upsertExit(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok({ exit_id: exitId });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid exit data");
        }
        console.error("Error creating exit:", error);
        return serverError("Failed to create exit");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:exit:prepare");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            lease_code: url.searchParams.get('lease_code') || undefined,
            component_code: url.searchParams.get('component_code') || undefined,
            kind: url.searchParams.get('kind') as any || undefined,
            status: url.searchParams.get('status') as any || undefined,
            event_date_from: url.searchParams.get('event_date_from') || undefined,
            event_date_to: url.searchParams.get('event_date_to') || undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
        };

        const validatedQuery = LeaseExitQuery.parse(query);
        const result = await exitService.queryExits(auth.company_id, validatedQuery);
        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying exits:", error);
        return serverError("Failed to query exits");
    } });
