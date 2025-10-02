// M16: Capex Plan Service
// Handles capex plan import/upsert with idempotency

import { pool } from "../../lib/db";
import { ulid } from "ulid";
import { createHash } from "crypto";

export interface CapexPlanUpsertPayload {
    asset_class: string;
    description: string;
    capex_amount: number;
    currency: string;
    present_ccy: string;
    in_service: string;
    life_m?: number | undefined;
    method?: "SL" | "DDB" | undefined;
    cost_center?: string | undefined;
    project?: string | undefined;
}

export interface CapexPlanResult {
    id: string;
    source_hash: string;
    created: boolean;
}

function generateSourceHash(companyId: string, payload: CapexPlanUpsertPayload): string {
    const data = JSON.stringify({ companyId, payload });
    return createHash("sha256").update(data).digest("hex");
}

export async function upsertPlan(
    companyId: string,
    actor: string,
    payload: CapexPlanUpsertPayload
): Promise<CapexPlanResult> {
    const sourceHash = generateSourceHash(companyId, payload);

    // Check if plan already exists with this source hash
    const existingResult = await pool.query(
        `SELECT id FROM capex_plan WHERE company_id = $1 AND source_hash = $2 LIMIT 1`,
        [companyId, sourceHash]
    );

    if (existingResult.rows.length > 0) {
        return {
            id: existingResult.rows[0].id,
            source_hash: sourceHash,
            created: false
        };
    }

    // Create new plan
    const id = ulid();
    await pool.query(
        `INSERT INTO capex_plan (
      id, company_id, asset_class, description, capex_amount, currency, present_ccy,
      in_service, life_m, method, cost_center, project, source_hash, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
            id, companyId, payload.asset_class, payload.description, payload.capex_amount,
            payload.currency, payload.present_ccy, payload.in_service, payload.life_m ?? null,
            payload.method ?? null, payload.cost_center ?? null, payload.project ?? null,
            sourceHash, actor
        ]
    );

    return {
        id,
        source_hash: sourceHash,
        created: true
    };
}

export async function getPlan(companyId: string, planId: string) {
    const result = await pool.query(
        `SELECT * FROM capex_plan WHERE company_id = $1 AND id = $2 LIMIT 1`,
        [companyId, planId]
    );

    return result.rows[0] || null;
}

export async function listPlans(companyId: string, limit: number = 100) {
    const result = await pool.query(
        `SELECT * FROM capex_plan WHERE company_id = $1 ORDER BY created_at LIMIT $2`,
        [companyId, limit]
    );

    return result.rows;
}
