// M16.1: Amortization Schedule Generation API Route
// Generates monthly amortization schedules for intangible plans

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../../lib/http";
import { AmortGenerateRequest } from "@aibos/contracts";
import { requireAuth, requireCapability } from "../../../../lib/auth";
import { generateAmortizationSchedules } from "../../../../services/intangibles/generate";
import { withRouteErrors } from "@/api/_kit";

export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const input = AmortGenerateRequest.parse(await req.json());
        const result = await generateAmortizationSchedules(auth.company_id, input.precision, input.plan_id);
        return ok(result);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Schedule generation failed: ${error.message}`);
        }
        return badRequest("Schedule generation failed");
    }
});
