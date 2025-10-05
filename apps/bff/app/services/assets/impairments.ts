// M16.3: Asset Impairments Service
// Handles asset impairment creation and journal posting

import { pool } from "../../lib/db";
import { ulid } from "ulid";
import { postJournal } from "@/services/gl/journals";
import { ImpairmentCreate } from "@aibos/contracts";

export interface ImpairmentResult {
    id: string;
    created: boolean;
    journal_id?: string;
}

/**
 * Creates an asset impairment and posts the journal entry
 */
export async function createImpairment(
    companyId: string,
    actor: string,
    input: ImpairmentCreate
): Promise<ImpairmentResult> {
    const id = ulid();

    // Insert impairment record
    await pool.query(
        `INSERT INTO asset_impairment (id, company_id, plan_kind, plan_id, date, amount, memo, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, companyId, input.plan_kind, input.plan_id, input.date, input.amount, input.memo || null, actor]
    );

    // Post impairment journal entry
    const journalId = await postImpairmentJE(
        companyId,
        input.plan_kind,
        input.plan_id,
        input.date,
        input.amount,
        input.memo
    );

    return {
        id,
        created: true,
        journal_id: journalId,
    };
}

/**
 * Posts impairment journal entry
 */
export async function postImpairmentJE(
    companyId: string,
    planKind: "capex" | "intangible",
    planId: string,
    date: string,
    amount: number,
    memo?: string
): Promise<string> {
    // Get posting map for the asset class/plan
    const postingMap = await getPostingMap(companyId, planKind, planId);
    if (!postingMap) {
        throw new Error(`No posting map found for ${planKind} plan ${planId}`);
    }

    // Create journal entry
    const journalDate = new Date(date);
    const journalMemo = memo || `Asset impairment - ${planKind} plan ${planId}`;

    const journal = {
        date: journalDate,
        memo: journalMemo,
        lines: [
            {
                accountId: postingMap.impairmentExpenseAccount,
                debit: amount,
                credit: 0,
                description: `Impairment expense - ${planKind} plan ${planId}`,
            },
            {
                accountId: postingMap.accumAccount,
                debit: 0,
                credit: amount,
                description: `Accumulated impairment - ${planKind} plan ${planId}`,
            },
        ],
        tags: {
            module: "impairment",
            plan_kind: planKind,
            plan_id: planId,
        },
    };

    const result = await postJournal(companyId, journal);
    return result.journalId;
}

/**
 * Gets posting map for impairment accounts
 */
async function getPostingMap(
    companyId: string,
    planKind: "capex" | "intangible",
    planId: string
): Promise<{
    impairmentExpenseAccount: string;
    accumAccount: string;
    currency: string;
} | null> {
    if (planKind === "capex") {
        // Get CAPEX plan details and posting map
        const planResult = await pool.query(
            `SELECT cp.asset_class, cp.present_ccy 
       FROM capex_plan cp 
       WHERE cp.id = $1 AND cp.company_id = $2`,
            [planId, companyId]
        );

        if (planResult.rows.length === 0) {
            return null;
        }

        const plan = planResult.rows[0];
        const mapResult = await pool.query(
            `SELECT depr_expense_account, accum_depr_account 
       FROM asset_posting_map 
       WHERE company_id = $1 AND asset_class = $2`,
            [companyId, plan.asset_class]
        );

        if (mapResult.rows.length === 0) {
            return null;
        }

        const map = mapResult.rows[0];
        return {
            impairmentExpenseAccount: map.depr_expense_account, // Reuse depreciation expense account
            accumAccount: map.accum_depr_account,
            currency: plan.present_ccy,
        };
    } else {
        // Get Intangible plan details and posting map
        const planResult = await pool.query(
            `SELECT ip.class, ip.present_ccy 
       FROM intangible_plan ip 
       WHERE ip.id = $1 AND ip.company_id = $2`,
            [planId, companyId]
        );

        if (planResult.rows.length === 0) {
            return null;
        }

        const plan = planResult.rows[0];
        const mapResult = await pool.query(
            `SELECT amort_expense_account, accum_amort_account 
       FROM intangible_posting_map 
       WHERE company_id = $1 AND class = $2`,
            [companyId, plan.class]
        );

        if (mapResult.rows.length === 0) {
            return null;
        }

        const map = mapResult.rows[0];
        return {
            impairmentExpenseAccount: map.amort_expense_account, // Reuse amortization expense account
            accumAccount: map.accum_amort_account,
            currency: plan.present_ccy,
        };
    }
}

/**
 * Lists impairments for a company
 */
export async function listImpairments(
    companyId: string,
    planKind?: "capex" | "intangible",
    planId?: string
): Promise<Array<{
    id: string;
    plan_kind: string;
    plan_id: string;
    date: string;
    amount: number;
    memo: string | null;
    created_at: string;
    created_by: string;
}>> {
    let query = `
    SELECT id, plan_kind, plan_id, date, amount, memo, created_at, created_by
    FROM asset_impairment
    WHERE company_id = $1
  `;
    const params: any[] = [companyId];

    if (planKind) {
        query += ` AND plan_kind = $${params.length + 1}`;
        params.push(planKind);
    }

    if (planId) {
        query += ` AND plan_id = $${params.length + 1}`;
        params.push(planId);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
        id: row.id,
        plan_kind: row.plan_kind,
        plan_id: row.plan_id,
        date: row.date,
        amount: Number(row.amount),
        memo: row.memo,
        created_at: row.created_at,
        created_by: row.created_by,
    }));
}
