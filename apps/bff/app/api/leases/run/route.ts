import { NextRequest, NextResponse } from "next/server";
import { LeasePostingService } from "@/services/lease/posting";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeasePostingRunReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const postingService = new LeasePostingService();

// POST /api/leases/run - Enhanced month-end posting
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:post");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeasePostingRunReq.parse(body);

        const result = await postingService.runMonthlyPostingEnhanced(auth.company_id, auth.user_id, data);

        return ok(result);
    } catch (error) {
        console.error("Error running monthly posting:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
