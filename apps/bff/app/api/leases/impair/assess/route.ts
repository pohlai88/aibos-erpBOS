import { NextRequest, NextResponse } from "next/server";
import { ImpairMeasureService } from "@/services/lease/impairment";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseImpairAssessReq, LeaseImpairTestQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const impairMeasureService = new ImpairMeasureService();

// POST /api/leases/impair/assess - Assess impairment for selected components or CGU
// GET /api/leases/impair/tests - Get impairment tests
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:impair");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeaseImpairAssessReq.parse(body);

        const result = await impairMeasureService.assessImpairment(
            auth.company_id,
            auth.user_id,
            data
        );

        return ok(result);
    } catch (error) {
        console.error("Error assessing impairment:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:impair");
        if (cap instanceof Response) return cap;

        const { searchParams } = new URL(request.url);
        const query: any = {};

        if (searchParams.get('as_of_date')) {
            query.as_of_date = searchParams.get('as_of_date');
        }
        if (searchParams.get('cgu_code')) {
            query.cgu_code = searchParams.get('cgu_code');
        }
        if (searchParams.get('status')) {
            query.status = searchParams.get('status');
        }

        const validatedQuery = LeaseImpairTestQuery.parse(query);
        const tests = await impairMeasureService.getImpairmentTests(
            auth.company_id,
            validatedQuery
        );

        return ok({ tests });
    } catch (error) {
        console.error("Error getting impairment tests:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
