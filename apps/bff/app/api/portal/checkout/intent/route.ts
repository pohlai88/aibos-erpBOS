import { NextRequest } from "next/server";
import { ok, badRequest, serverError, unauthorized } from "@/lib/http";
import { CheckoutIntentReq } from "@aibos/contracts";
import { ArPortalService } from "@/services/ar/portal";
import { ArCheckoutService } from "@/services/ar/checkout";
import { checkIdempotency, recordIdempotency, getIdemKey } from "@/lib/idempotency";
import { withRouteErrors } from "@/api/_kit";

const portalService = new ArPortalService();
const checkoutService = new ArCheckoutService();

// POST /api/portal/checkout/intent - Create checkout intent
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const body = await req.json().catch(() => null);
        if (!body) return badRequest("Invalid JSON body");

        const input = CheckoutIntentReq.safeParse(body);
        if (!input.success) return badRequest(input.error.message);

        // Resolve token to get customer context
        const session = await portalService.resolveToken(input.data.token);
        if (!session) {
            return unauthorized("Invalid or expired token");
        }

        // Check idempotency
        const idempotencyKey = req.headers.get("Idempotency-Key");
        if (idempotencyKey) {
            const existing = await checkIdempotency(idempotencyKey, session.companyId);
            if (existing) {
                return ok(existing.result, { "X-Idempotent-Replay": "true" });
            }
        }

        const result = await checkoutService.createIntent(
            session.companyId,
            session.customerId,
            input.data,
            'portal-user'
        );

        // Record idempotency if key provided
        if (idempotencyKey) {
            await recordIdempotency(idempotencyKey, session.companyId, "checkout-intent", result);
        }

        return ok(result);
    } catch (err: any) {
        console.error("RouteError", { path: "portal/checkout/intent", err });
        return serverError("Unexpected error");
    } });
