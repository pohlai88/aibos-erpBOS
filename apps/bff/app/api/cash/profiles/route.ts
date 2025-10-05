// M15: Working Capital Profile Management
// apps/bff/app/api/cash/profiles/route.ts

import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { z } from "zod";
import { pool } from "../../../lib/db";

// Define schema locally to avoid import issues
const WcProfileCreate = z.object({
    name: z.string().min(1),
    dso_days: z.number().min(0),
    dpo_days: z.number().min(0),
    dio_days: z.number().min(0),
    tax_rate_pct: z.number().min(0).max(100).default(24),
    interest_apr: z.number().min(0).max(100).default(6),
});

// Simple ULID generator
function generateId(): string {
    return `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const POST = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "cash:manage");
        if (isResponse(capCheck)) return capCheck;

        const body = await req.json();
        const payload = WcProfileCreate.parse(body);

        const id = generateId();
        await pool.query(
            `INSERT INTO wc_profile (id, company_id, name, dso_days, dpo_days, dio_days, tax_rate_pct, interest_apr, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                id,
                auth.company_id,
                payload.name,
                payload.dso_days,
                payload.dpo_days,
                payload.dio_days,
                payload.tax_rate_pct,
                payload.interest_apr,
                auth.user_id || "unknown"
            ]
        );

        return ok({ id });
    } catch (error) {
        console.error("Error creating WC profile:", error);
        return badRequest("Failed to create working capital profile");
    }
});

export const GET = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "cash:manage");
        if (isResponse(capCheck)) return capCheck;

        const result = await pool.query(
            `SELECT id, name, dso_days, dpo_days, dio_days, tax_rate_pct, interest_apr, created_at
       FROM wc_profile WHERE company_id = $1 ORDER BY created_at DESC`,
            [auth.company_id]
        );

        return ok({
            profiles: result.rows.map(row => ({
                id: row.id,
                name: row.name,
                dso_days: Number(row.dso_days),
                dpo_days: Number(row.dpo_days),
                dio_days: Number(row.dio_days),
                tax_rate_pct: Number(row.tax_rate_pct),
                interest_apr: Number(row.interest_apr),
                created_at: row.created_at
            }))
        });
    } catch (error) {
        console.error("Error listing WC profiles:", error);
        return badRequest("Failed to list working capital profiles");
    }
});
