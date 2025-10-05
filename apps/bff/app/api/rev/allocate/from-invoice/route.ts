import { NextRequest, NextResponse } from "next/server";
import { RevAllocationEngineService } from "@/services/revenue/allocation-engine";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { AllocateFromInvoiceReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const allocationEngineService = new RevAllocationEngineService();

// POST /api/rev/allocate/from-invoice - Enhanced allocation from invoice using SSP catalog and discount rules
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:allocate");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = AllocateFromInvoiceReq.parse(body);

        const result = await allocationEngineService.allocateFromInvoice(
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
    } });
