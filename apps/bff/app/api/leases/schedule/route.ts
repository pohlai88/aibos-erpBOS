import { NextRequest, NextResponse } from "next/server";
import { LeaseScheduleService } from "@/services/lease/schedule";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseScheduleQuery, LeaseMaturityQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const scheduleService = new LeaseScheduleService();

// GET /api/leases/schedule - Query lease schedule
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            lease_code: url.searchParams.get('lease_code') || undefined,
            year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
            month: url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined,
            present: url.searchParams.get('present') || undefined
        };

        const validatedQuery = LeaseScheduleQuery.parse(query);
        const result = await scheduleService.querySchedule(auth.company_id, validatedQuery);
        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying lease schedule:", error);
        return serverError("Failed to query lease schedule");
    } });
