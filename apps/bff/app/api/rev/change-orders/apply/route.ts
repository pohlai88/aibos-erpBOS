import { NextRequest, NextResponse } from "next/server";
import { RevModificationService } from "@/services/rb/modifications";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { ApplyChangeOrderReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const modificationService = new RevModificationService();

// POST /api/rev/change-orders/apply - Apply change order with treatment
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:modify");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = ApplyChangeOrderReq.parse(body);

        const result = await modificationService.applyChangeOrder(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        console.error("Error applying change order:", error);
        return serverError("Failed to apply change order");
    } });
