import { NextRequest, NextResponse } from "next/server";
import { LeaseRemeasureService } from "@/services/lease/cpi";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseEventApplyReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const remeasureService = new LeaseRemeasureService();

// POST /api/leases/events/apply - Apply remeasurement event
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:manage");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeaseEventApplyReq.parse(body);

        const result = await remeasureService.applyEvent(auth.company_id, auth.user_id, data);

        return ok(result);
    } catch (error) {
        console.error("Error applying remeasurement event:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
