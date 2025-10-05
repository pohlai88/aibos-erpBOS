import { NextRequest, NextResponse } from "next/server";
import { ArStatementService } from "@/services/ar/statements";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const statementService = new ArStatementService();

// GET /api/ar/statements/runs - List statement runs
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:stmt:run");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const status = url.searchParams.get('status');
        const asOfDate = url.searchParams.get('as_of_date');

        const result = await statementService.listStatementRuns(
            auth.company_id,
            {
                limit,
                offset,
                ...(status && { status: status as any }),
                ...(asOfDate && { asOfDate })
            }
        );

        return ok(result);
    } catch (error) {
        console.error('List statement runs error:', error);
        return serverError('Failed to list statement runs');
    } });
