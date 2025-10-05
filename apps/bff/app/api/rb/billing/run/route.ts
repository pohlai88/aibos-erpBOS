import { NextRequest, NextResponse } from "next/server";
import { RbBillingService } from "@/services/rb/billing";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { BillingRunReq, InvoiceQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const billingService = new RbBillingService();

// POST /api/rb/billing/run - Run billing for a period
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:invoice:run");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = BillingRunReq.parse(body);

        const result = await billingService.runBilling(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid billing run data");
        }
        console.error("Error running billing:", error);
        return serverError("Failed to run billing");
    } });
