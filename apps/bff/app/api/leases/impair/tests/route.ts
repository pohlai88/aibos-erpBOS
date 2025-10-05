import { NextRequest, NextResponse } from "next/server";
import { RecoverableAmountEngine } from "@/services/lease/recoverable-amount-engine";
import { ImpairmentPoster } from "@/services/lease/impairment-poster";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { ImpairmentTestUpsert, ImpairmentTestQuery, ImpairmentTestPostReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const recoverableEngine = new RecoverableAmountEngine();
const impairmentPoster = new ImpairmentPoster();

// POST /api/leases/impair/tests - Create impairment test
// GET /api/leases/impair/tests - Query impairment tests
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:impair:test");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = ImpairmentTestUpsert.parse(body);

        const testId = await recoverableEngine.createImpairmentTest(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok({ test_id: testId });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid test data");
        }
        console.error("Error creating impairment test:", error);
        return serverError("Failed to create impairment test");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:impair:test");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const queryParams = {
            as_of_date: url.searchParams.get("as_of") || undefined,
            cgu_id: url.searchParams.get("cgu") || undefined,
            method: url.searchParams.get("method") || undefined,
            status: url.searchParams.get("status") || undefined,
            limit: parseInt(url.searchParams.get("limit") || "50"),
            offset: parseInt(url.searchParams.get("offset") || "0")
        };

        const validatedQuery = ImpairmentTestQuery.parse(queryParams);
        
        // This would need to be implemented in the service
        // const tests = await recoverableEngine.queryTests(auth.company_id, validatedQuery);

        return ok({ tests: [] }); // Placeholder
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying tests:", error);
        return serverError("Failed to query tests");
    } });
