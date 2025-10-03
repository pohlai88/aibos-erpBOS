import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { PortalInvoicesReq } from "@aibos/contracts";

const portalService = new ArPortalService();

// POST /api/portal/invoices - List customer invoices
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const req = PortalInvoicesReq.parse(body);

        // Resolve token to get customer context
        const session = await portalService.resolveToken(req.token);
        if (!session) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const result = await portalService.listInvoices(
            session.companyId,
            session.customerId,
            req.include_paid
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Portal invoices error:', error);
        return NextResponse.json(
            { error: 'Failed to list invoices' },
            { status: 500 }
        );
    }
}