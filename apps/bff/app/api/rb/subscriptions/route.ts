import { NextRequest, NextResponse } from "next/server";
import { RbContractsService } from "@/services/rb/contracts";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SubscriptionUpsert, SubscriptionQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const contractsService = new RbContractsService();

// GET /api/rb/subscriptions - List subscriptions
// POST /api/rb/subscriptions - Create/update subscription
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:contract");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            customer_id: url.searchParams.get('customer_id') || undefined,
            status: url.searchParams.get('status') as any || undefined,
            bill_anchor: url.searchParams.get('bill_anchor') || undefined,
            limit: parseInt(url.searchParams.get('limit') || '50'),
            offset: parseInt(url.searchParams.get('offset') || '0')
        };

        const result = await contractsService.getSubscriptions(auth.company_id, query);
        return ok(result);
    } catch (error) {
        console.error("Error listing subscriptions:", error);
        return serverError("Failed to list subscriptions");
    } });
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:contract");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = SubscriptionUpsert.parse(body);

        const result = await contractsService.upsertSubscription(
            auth.company_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid subscription data");
        }
        console.error("Error creating subscription:", error);
        return serverError("Failed to create subscription");
    } });
