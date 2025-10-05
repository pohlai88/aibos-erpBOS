import { NextRequest, NextResponse } from "next/server";
import { SubleaseScheduler } from "@/services/lease/sublease-scheduler";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SubleaseScheduleRebuildReq, SubleaseScheduleQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const subleaseScheduler = new SubleaseScheduler();

// POST /api/subleases/:id/schedule - Build sublease schedule
// GET /api/subleases/:id/schedule - Query sublease schedule
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:sublease");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = SubleaseScheduleRebuildReq.parse({
            ...body,
            subleaseId: params.id
        });

        const result = await subleaseScheduler.buildSchedule(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid schedule data");
        }

        console.error("Error building sublease schedule:", error);
        return serverError("Failed to build sublease schedule");
    } });
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            subleaseId: params.id,
            year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
            month: url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined,
            classification: url.searchParams.get('classification') as any || undefined
        };

        const validatedQuery = SubleaseScheduleQuery.parse(query);
        const result = await subleaseScheduler.querySchedule(auth.company_id, validatedQuery);
        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying sublease schedule:", error);
        return serverError("Failed to query sublease schedule");
    } });
