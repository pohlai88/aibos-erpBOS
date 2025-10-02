// M16: Depreciation Schedule Generation API Route
// Generates monthly depreciation schedules for capex plans

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../../lib/http";
import { DeprGenerateRequest } from "@contracts/capex";
import { requireAuth, requireCapability } from "../../../../lib/auth";
import { generateSchedules } from "../../../../services/capex/generate";

async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const input = DeprGenerateRequest.parse(await req.json());
        const result = await generateSchedules(auth.company_id, input.precision, input.plan_id);
        return ok(result);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Schedule generation failed: ${error.message}`);
        }
        return badRequest("Schedule generation failed");
    }
}

export { POST };
