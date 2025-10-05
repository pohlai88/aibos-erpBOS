import { NextRequest, NextResponse } from "next/server";
import { RbCreditsService } from "@/services/rb/credits";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { CreditApplyReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const creditsService = new RbCreditsService();

// POST /api/rb/credits/apply - Apply credit memo to invoice
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:credit");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = CreditApplyReq.parse(body);

        await creditsService.applyCreditMemo(
            auth.company_id,
            validatedData
        );

        return ok({ success: true });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid credit apply data");
        }
        console.error("Error applying credit:", error);
        return serverError("Failed to apply credit");
    } });
