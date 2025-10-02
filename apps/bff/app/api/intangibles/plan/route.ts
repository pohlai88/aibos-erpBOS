// M16.1: Intangible Plan API Route
// Handles intangible plan creation and management

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { IntangiblePlanUpsert } from "@contracts/intangibles";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { upsertIntangiblePlan } from "../../../services/intangibles/plan";

async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const input = IntangiblePlanUpsert.parse(await req.json());
        const result = await upsertIntangiblePlan(auth.company_id, auth.user_id ?? "unknown", input);
        return ok(result);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Invalid intangible plan data: ${error.message}`);
        }
        return badRequest("Invalid intangible plan data");
    }
}

export { POST };
