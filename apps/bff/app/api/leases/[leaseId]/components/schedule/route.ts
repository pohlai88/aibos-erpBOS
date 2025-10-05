import { NextRequest, NextResponse } from "next/server";
import { ComponentScheduleService } from "@/services/lease/component";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseComponentScheduleReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const componentScheduleService = new ComponentScheduleService();

// POST /api/leases/:leaseId/components/schedule - Build/refresh component schedules
// GET /api/leases/:leaseId/components/schedule - Get component schedules
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { leaseId: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:component");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeaseComponentScheduleReq.parse(body);

        const result = await componentScheduleService.buildSchedules(
            auth.company_id,
            auth.user_id,
            params.leaseId
        );

        return ok(result);
    } catch (error) {
        console.error("Error building component schedules:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { leaseId: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:component");
        if (cap instanceof Response) return cap;

        const { searchParams } = new URL(request.url);
        const componentId = searchParams.get('component_id');
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

        if (!componentId) {
            return badRequest("component_id is required");
        }

        const schedules = await componentScheduleService.getComponentSchedule(
            auth.company_id,
            componentId,
            year,
            month
        );

        return ok({ schedules });
    } catch (error) {
        console.error("Error getting component schedules:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
