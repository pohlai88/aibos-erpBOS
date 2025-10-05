import { NextRequest, NextResponse } from "next/server";
import { ArPortalLedgerService } from "@/services/ar/portal-ledger";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { PortalLedgerReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const portalLedgerService = new ArPortalLedgerService();

// POST /api/portal/ledger - Get customer ledger via token
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const body = await request.json();
        const validatedBody = PortalLedgerReq.parse(body);

        const result = await portalLedgerService.getCustomerLedger(validatedBody);

        return ok(result);
    } catch (error) {
        console.error('Portal ledger error:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest('Invalid request body', error);
        }
        if (error instanceof Error && (error.message.includes('Invalid token') || error.message.includes('expired'))) {
            return badRequest(error.message);
        }
        return serverError('Failed to get customer ledger');
    } });
