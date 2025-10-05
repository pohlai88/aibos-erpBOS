import { NextRequest, NextResponse } from "next/server";
import { ArPortalLedgerService } from "@/services/ar/portal-ledger";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const portalLedgerService = new ArPortalLedgerService();

// GET /api/portal/statements/latest - Get latest statement artifacts
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return badRequest('Token parameter is required');
        }

        const result = await portalLedgerService.getLatestStatementArtifacts(token);

        return ok(result);
    } catch (error) {
        console.error('Latest statement error:', error);
        if (error instanceof Error && (error.message.includes('Invalid token') || error.message.includes('expired'))) {
            return badRequest(error.message);
        }
        return serverError('Failed to get latest statement');
    } });
