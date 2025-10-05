import { NextRequest, NextResponse } from "next/server";
import { ArStatementService } from "@/services/ar/statements";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError, notFound } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const statementService = new ArStatementService();

// GET /api/ar/statements/[run_id]/customers - Get customers for a statement run
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { run_id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:stmt:run");
        if (cap instanceof Response) return cap;

        const runId = params.run_id;
        if (!runId) {
            return badRequest('Run ID is required');
        }

        const result = await statementService.getStatementRunCustomers(
            auth.company_id,
            runId
        );

        if (!result) {
            return notFound('Statement run not found');
        }

        return ok(result);
    } catch (error) {
        console.error('Get statement run customers error:', error);
        return serverError('Failed to get statement run customers');
    } });
