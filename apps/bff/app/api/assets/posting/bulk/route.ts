// M16.2: Bulk Asset Posting API Route
// Handles bulk posting of depreciation/amortization with dry-run diff

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "@/lib/http";
import { requireAuth, requireCapability } from "@/lib/auth";
import { BulkPostRequest } from "@aibos/contracts";
import { bulkPostAssets, validatePostingSafety } from "@/services/assets/bulkPost";
import { withRouteErrors } from "@/api/_kit";

export const POST = withRouteErrors(async (req: NextRequest) => { const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const input = BulkPostRequest.parse(await req.json());

        // Validate posting safety
        const safetyCheck = await validatePostingSafety(
            auth.company_id,
            input.kind,
            input.year,
            input.month,
            input.plan_ids
        );

        if (!safetyCheck.safe && !input.dry_run) {
            return badRequest(`Posting safety check failed: ${safetyCheck.warnings.join(", ")}`);
        }

        const result = await bulkPostAssets(
            auth.company_id,
            input.kind,
            input.year,
            input.month,
            input.dry_run,
            input.memo,
            input.plan_ids
        );

        // Include safety warnings in response
        const response = {
            ...result,
            warnings: safetyCheck.warnings
        };

        return ok(response);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Bulk posting failed: ${error.message}`);
        }
        return badRequest("Bulk posting failed");
    } });
