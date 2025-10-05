import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { DisputePublicCreate } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const portalService = new ArPortalService();

// POST /api/portal/disputes - Create dispute
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const body = await request.json();
        const req = DisputePublicCreate.parse(body);

        // Resolve token to get customer context
        const session = await portalService.resolveToken(req.token);
        if (!session) {
            return ok({ error: 'Invalid or expired token' }, 401);
        }

        const result = await portalService.createDispute(
            session.companyId,
            session.customerId,
            req.invoice_id,
            req.reason_code,
            req.detail
        );

        return ok(result);
    } catch (error) {
        console.error('Portal dispute error:', error);
        return ok({ error: 'Failed to create dispute' }, 500);
    } });
