import { NextRequest, NextResponse } from "next/server";
import { RevAllocationService } from "@/services/revenue/allocate";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { AllocFromInvoiceReq } from "@aibos/contracts";

const allocationService = new RevAllocationService();

// POST /api/rev/allocate/from-invoice - Allocate from invoice
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:allocate");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = AllocFromInvoiceReq.parse(body);

        const result = await allocationService.allocateFromInvoice(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid allocation data");
        }
        console.error("Error allocating from invoice:", error);
        return serverError("Failed to allocate from invoice");
    }
}
