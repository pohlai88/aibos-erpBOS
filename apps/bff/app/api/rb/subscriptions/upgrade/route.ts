import { NextRequest, NextResponse } from "next/server";
import { RbContractsService } from "@/services/rb/contracts";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SubscriptionUpgradeReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const contractsService = new RbContractsService();

// POST /api/rb/subscriptions/upgrade - Upgrade/downgrade subscription
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:contract");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = SubscriptionUpgradeReq.parse(body);

        const result = await contractsService.upgradeSubscription(
            auth.company_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid upgrade data");
        }
        console.error("Error upgrading subscription:", error);
        return serverError("Failed to upgrade subscription");
    } });
