import { NextRequest, NextResponse } from "next/server";
import { RbBillingService } from "@/services/rb/billing";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError, notFound } from "@/api/_lib/http";
import { InvoiceFinalizeReq } from "@aibos/contracts";

const billingService = new RbBillingService();

// GET /api/rb/invoices/[id] - Get invoice details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:invoice:run");
        if (cap instanceof Response) return cap;

        const invoices = await billingService.getInvoices(auth.company_id, {
            limit: 1,
            offset: 0
        });

        const invoice = invoices.find(inv => inv.id === params.id);
        if (!invoice) {
            return notFound("Invoice not found");
        }

        const lines = await billingService.getInvoiceLines(auth.company_id, params.id);

        return ok({
            invoice,
            lines
        });
    } catch (error) {
        console.error("Error getting invoice:", error);
        return serverError("Failed to get invoice");
    }
}

// POST /api/rb/invoices/[id]/finalize - Finalize invoice
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:invoice:run");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = InvoiceFinalizeReq.parse(body);

        const result = await billingService.finalizeInvoice(
            auth.company_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid finalize data");
        }
        console.error("Error finalizing invoice:", error);
        return serverError("Failed to finalize invoice");
    }
}
