import { z } from "zod";
import { pool } from "../../../lib/db";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ok, badRequest } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

// Schema for creating budget versions
const CreateBudgetVersionSchema = z.object({
    code: z.string().min(1).max(50),
    label: z.string().min(1).max(200),
    year: z.number().int().min(1900).max(2100),
    isBaseline: z.boolean().optional().default(false),
});

export const POST = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:manage");
        if (isResponse(capCheck)) return capCheck;

        const body = await req.json();
        const payload = CreateBudgetVersionSchema.parse(body);

        // Check if version code already exists for this company
        const existingVersion = await pool.query(
            `SELECT id FROM budget_version WHERE company_id = $1 AND code = $2`,
            [auth.company_id, payload.code]
        );

        if (existingVersion.rows.length > 0) {
            return badRequest(`Version code '${payload.code}' already exists`);
        }

        // Create new budget version
        const versionId = `bv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const result = await pool.query(
            `INSERT INTO budget_version 
       (id, company_id, code, label, year, is_baseline, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $7)
       RETURNING *`,
            [
                versionId,
                auth.company_id,
                payload.code,
                payload.label,
                payload.year,
                payload.isBaseline,
                auth.user_id,
            ]
        );

        return ok({
            version: result.rows[0],
            message: "Budget version created successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return badRequest("Invalid request data", error.errors);
        }
        console.error("Error creating budget version:", error);
        return badRequest("Failed to create budget version");
    }
});

export const GET = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:read");
        if (isResponse(capCheck)) return capCheck;

        const result = await pool.query(
            `SELECT * FROM budget_version 
       WHERE company_id = $1 
       ORDER BY year DESC, created_at DESC`,
            [auth.company_id]
        );

        return ok({
            versions: result.rows,
        });
    } catch (error) {
        console.error("Error fetching budget versions:", error);
        return badRequest("Failed to fetch budget versions");
    }
});
