// M16: Depreciation Posting API Route
// Posts depreciation schedules to GL via journal entries

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../../lib/http";
import { DeprPostRequest } from "@aibos/contracts";
import { requireAuth, requireCapability } from "../../../../lib/auth";
import { postDepreciation } from "../../../../services/capex/post";
import { withRouteErrors } from "@/api/_kit";

export { POST };

export const POST = withRouteErrors(async (req: NextRequest) => { const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const input = DeprPostRequest.parse(await req.json());
        const result = await postDepreciation(
            auth.company_id,
            input.year,
            input.month,
            input.memo,
            input.plan_id,
            input.dry_run
        );

        if (!result.posted && !input.dry_run) {
            return badRequest("No schedules to post for the specified period");
        }

        return ok(result);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Depreciation posting failed: ${error.message}`);
        }
        return badRequest("Depreciation posting failed");
    } });
