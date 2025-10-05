// M16.4: FX Presentation Lock Service
// Handles FX rate resolution and snapshotting for audit compliance

import { pool } from "../../../lib/db";
import { ulid } from "ulid";

export interface FxRateParams {
    companyId: string;
    planKind: "capex" | "intangible";
    planId: string;
    policy: "post_month" | "in_service";
    year?: number;
    month?: number;
    srcCcy: string;
    presentCcy: string;
}

/**
 * Resolves FX rate and snapshots it for audit compliance
 */
export async function resolveFxRate(params: FxRateParams): Promise<number> {
    const { companyId, planKind, planId, policy, year, month, srcCcy, presentCcy } = params;

    // Check if we already have a snapshot for this combination
    const existingSnapshot = await pool.query(
        `SELECT rate FROM fx_snapshot 
     WHERE company_id = $1 AND plan_kind = $2 AND plan_id = $3 
     AND policy = $4 AND COALESCE(year, 0) = $5 AND COALESCE(month, 0) = $6`,
        [companyId, planKind, planId, policy, year || 0, month || 0]
    );

    if (existingSnapshot.rows.length > 0) {
        return Number(existingSnapshot.rows[0].rate);
    }

    // Fetch fresh rate from FX service
    const rate = await fetchFxRate(srcCcy, presentCcy, policy === "post_month" && year && month ? { year, month } : undefined);

    // Snapshot the rate for audit compliance
    const snapshotId = ulid();
    await pool.query(
        `INSERT INTO fx_snapshot (id, company_id, plan_kind, plan_id, policy, year, month, rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (company_id, plan_kind, plan_id, COALESCE(year,0), COALESCE(month,0), policy) 
     DO UPDATE SET rate = EXCLUDED.rate`,
        [snapshotId, companyId, planKind, planId, policy, year || null, month || null, rate]
    );

    return rate;
}

/**
 * Mock FX rate fetcher - replace with your actual FX service
 */
async function fetchFxRate(
    srcCcy: string,
    presentCcy: string,
    period?: { year: number; month: number }
): Promise<number> {
    // Mock implementation - replace with your actual FX service
    if (srcCcy === presentCcy) {
        return 1.0;
    }

    // Mock rates for common currency pairs
    const mockRates: Record<string, number> = {
        "USD-MYR": 4.2,
        "MYR-USD": 0.24,
        "EUR-MYR": 4.5,
        "MYR-EUR": 0.22,
        "SGD-MYR": 3.1,
        "MYR-SGD": 0.32,
    };

    const key = `${srcCcy}-${presentCcy}`;
    return mockRates[key] || 1.0;
}

/**
 * Gets FX rate history for audit purposes
 */
export async function getFxRateHistory(
    companyId: string,
    planKind: "capex" | "intangible",
    planId: string
): Promise<Array<{
    id: string;
    policy: string;
    year: number | null;
    month: number | null;
    rate: number;
    created_at: string;
}>> {
    const result = await pool.query(
        `SELECT id, policy, year, month, rate, created_at
     FROM fx_snapshot
     WHERE company_id = $1 AND plan_kind = $2 AND plan_id = $3
     ORDER BY created_at DESC`,
        [companyId, planKind, planId]
    );

    return result.rows.map(row => ({
        id: row.id,
        policy: row.policy,
        year: row.year,
        month: row.month,
        rate: Number(row.rate),
        created_at: row.created_at,
    }));
}

/**
 * Validates FX rate parameters
 */
export function validateFxParams(params: FxRateParams): { valid: boolean; error?: string } {
    if (!params.companyId || !params.planKind || !params.planId) {
        return { valid: false, error: "Missing required parameters" };
    }

    if (!["capex", "intangible"].includes(params.planKind)) {
        return { valid: false, error: "Invalid plan kind" };
    }

    if (!["post_month", "in_service"].includes(params.policy)) {
        return { valid: false, error: "Invalid policy" };
    }

    if (params.policy === "post_month" && (!params.year || !params.month)) {
        return { valid: false, error: "Year and month required for post_month policy" };
    }

    if (!params.srcCcy || !params.presentCcy) {
        return { valid: false, error: "Source and present currencies required" };
    }

    return { valid: true };
}
