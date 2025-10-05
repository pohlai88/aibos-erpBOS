import { NextRequest, NextResponse } from "next/server";
import { ImpairPostingService } from "@/services/lease/impairment";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseImpairPostReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const impairPostingService = new ImpairPostingService();

// POST /api/leases/impair/post - Post impairment charges/reversals
// GET /api/leases/impair/post - Get impairment postings for a period
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:impair");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeaseImpairPostReq.parse(body);

        const result = await impairPostingService.postImpairment(
            auth.company_id,
            auth.user_id,
            data
        );

        return ok(result);
    } catch (error) {
        console.error("Error posting impairment:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:impair");
        if (cap instanceof Response) return cap;

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        if (!year || !month) {
            return badRequest("year and month are required");
        }

        const postings = await impairPostingService.getImpairmentPostings(
            auth.company_id,
            parseInt(year),
            parseInt(month)
        );

        return ok({ postings });
    } catch (error) {
        console.error("Error getting impairment postings:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
