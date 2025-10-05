// M15: Cash Flow Generation
// apps/bff/app/api/cash/versions/[id]/generate/route.ts

import { ok, badRequest, forbidden } from "../../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../../lib/route-utils";
import { z } from "zod";
import { pool } from "../../../../../lib/db";
import { generateCashFlow } from "../../../../../services/cash/generator";

// Define schema locally to avoid import issues
const CashGenerateRequest = z.object({
    from_scenario: z.string().min(1),
    profile_name: z.string().optional(),
    present_ccy: z.string().length(3).default("MYR"),
    precision: z.number().int().min(0).max(6).default(2),
});

export const POST = withRouteErrors(async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "cash:manage");
        if (isResponse(capCheck)) return capCheck;

        const { id: versionId } = await params;
        const body = await req.json();
        const payload = CashGenerateRequest.parse(body);

        // Get cash version
        const versionResult = await pool.query(
            `SELECT id, year, profile_id FROM cash_forecast_version 
       WHERE company_id = $1 AND id = $2`,
            [auth.company_id, versionId]
        );

        if (versionResult.rows.length === 0) {
            return badRequest("Unknown cash forecast version");
        }

        const version = versionResult.rows[0];

        // Get working capital profile
        let profile: any = null;
        if (version.profile_id) {
            const profileResult = await pool.query(
                `SELECT dso_days, dpo_days, dio_days, tax_rate_pct, interest_apr
         FROM wc_profile WHERE id = $1`,
                [version.profile_id]
            );
            if (profileResult.rows.length > 0) {
                profile = profileResult.rows[0];
            }
        } else if (payload.profile_name) {
            const profileResult = await pool.query(
                `SELECT dso_days, dpo_days, dio_days, tax_rate_pct, interest_apr
         FROM wc_profile WHERE company_id = $1 AND name = $2`,
                [auth.company_id, payload.profile_name]
            );
            if (profileResult.rows.length > 0) {
                profile = profileResult.rows[0];
            }
        }

        if (!profile) {
            return badRequest("No working capital profile bound to this generation");
        }

        // Generate cash flow
        const result = await generateCashFlow(
            auth.company_id,
            versionId,
            version.year,
            {
                dso_days: Number(profile.dso_days),
                dpo_days: Number(profile.dpo_days),
                dio_days: Number(profile.dio_days),
                tax_rate_pct: Number(profile.tax_rate_pct),
                interest_apr: Number(profile.interest_apr)
            },
            payload.present_ccy,
            payload.precision,
            payload.from_scenario
        );

        return ok(result);
    } catch (error) {
        console.error("Error generating cash flow:", error);
        return badRequest("Failed to generate cash flow forecast");
    }
});
