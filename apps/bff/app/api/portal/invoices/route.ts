import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { PortalInvoicesReq } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const portalService = new ArPortalService();

// POST /api/portal/invoices - List customer invoices
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const body = await request.json();
        const req = PortalInvoicesReq.parse(body);

        // Resolve token to get customer context
        const session = await portalService.resolveToken(req.token);
        if (!session) {
            return ok({ error: 'Invalid or expired token' }, 401);
        }

        const result = await portalService.listInvoices(
            session.companyId,
            session.customerId,
            req.include_paid
        );

        return ok(result);
    } catch (error) {
        console.error('Portal invoices error:', error);
        return ok({ error: 'Failed to list invoices' }, 500);
    } });
