import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { ConsolRunRequestType } from "@aibos/contracts";
import { getOwnershipTree } from "./entities";

// --- Consolidation Run Engine (M21) ----------------------------------------
export interface ConsolRun {
    id: string;
    companyId: string;
    groupCode: string;
    year: number;
    month: number;
    mode: string;
    presentCcy: string;
    createdAt: string;
    createdBy: string;
    summary?: ConsolSummary[];
}

export interface ConsolSummary {
    id: string;
    runId: string;
    component: string;
    label: string;
    amount: number;
}

export interface ConsolRunResult {
    runId: string;
    summary: ConsolSummary[];
    consolidatedPl?: Array<{ account: string; amount: number }>;
    consolidatedBs?: Array<{ account: string; amount: number }>;
}

export interface TrialBalanceRow {
    entityCode: string;
    accountCode: string;
    balance: number;
    currency: string;
}

export async function runConsolidation(
    companyId: string,
    data: ConsolRunRequestType,
    actor: string
): Promise<ConsolRunResult> {
    const runId = ulid();
    const presentCcy = data.present_ccy || 'USD';

    // Check for existing lock (idempotency)
    if (!data.dry_run) {
        const { rows: lockRows } = await pool.query(`
      SELECT 1 FROM consol_lock 
      WHERE company_id = $1 AND group_code = $2 AND year = $3 AND month = $4
    `, [companyId, data.group_code, data.year, data.month]);

        if (lockRows.length > 0) {
            throw new Error(`Consolidation already committed for ${data.group_code} ${data.year}-${data.month}`);
        }
    }

    // Create run record
    await pool.query(`
    INSERT INTO consol_run (id, company_id, group_code, year, month, mode, present_ccy, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [runId, companyId, data.group_code, data.year, data.month, data.dry_run ? 'dry_run' : 'commit', presentCcy, actor]);

    // Get ownership tree as of period end
    const periodEndDate = `${data.year}-${data.month.toString().padStart(2, '0')}-01`;
    const ownershipTree = await getOwnershipTree(companyId, data.group_code, periodEndDate);

    // Get trial balances for all entities in the group
    const trialBalances = await getEntityTrialBalances(companyId, data.group_code, data.year, data.month);

    // Translate to presentation currency
    const translatedBalances = await translateToPresentationCurrency(
        companyId, trialBalances, presentCcy, data.year, data.month
    );

    // Apply IC eliminations
    const eliminatedBalances = await applyIcEliminations(
        companyId, data.group_code, translatedBalances, data.year, data.month
    );

    // Calculate minority interest
    const minorityBalances = await calculateMinorityInterest(
        companyId, data.group_code, eliminatedBalances, ownershipTree
    );

    // Generate consolidated statements
    const consolidatedPl = generateConsolidatedPl(minorityBalances);
    const consolidatedBs = generateConsolidatedBs(minorityBalances);

    // Create summary
    const summary = await createConsolSummary(runId, {
        translation: calculateTranslationSummary(translatedBalances),
        icElim: calculateIcElimSummary(eliminatedBalances),
        minority: calculateMinoritySummary(minorityBalances)
    });

    // Create lock if committing
    if (!data.dry_run) {
        await pool.query(`
      INSERT INTO consol_lock (company_id, group_code, year, month)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [companyId, data.group_code, data.year, data.month]);
    }

    return {
        runId,
        summary,
        consolidatedPl,
        consolidatedBs
    };
}

async function getEntityTrialBalances(
    companyId: string,
    groupCode: string,
    year: number,
    month: number
): Promise<TrialBalanceRow[]> {
    // Get all entities in the group
    const { rows: entityRows } = await pool.query(`
    SELECT DISTINCT e.entity_code, e.base_ccy
    FROM co_entity e
    JOIN co_ownership o ON e.entity_code = o.child_code
    WHERE e.company_id = $1 AND o.group_code = $2 AND e.active = true
  `, [companyId, groupCode]);

    const trialBalances: TrialBalanceRow[] = [];

    // Get trial balance for each entity
    for (const entity of entityRows) {
        const { rows: tbRows } = await pool.query(`
      SELECT 
        jl.account_code,
        SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END) as balance
      FROM journal_line jl
      JOIN journal j ON j.id = jl.journal_id
      WHERE j.company_id = $1
        AND EXTRACT(YEAR FROM j.posting_date) = $2
        AND EXTRACT(MONTH FROM j.posting_date) = $3
        AND j.source_doctype LIKE '%' || $4 || '%'
      GROUP BY jl.account_code
      HAVING SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END) != 0
    `, [companyId, year, month, entity.entity_code]);

        for (const row of tbRows) {
            trialBalances.push({
                entityCode: entity.entity_code,
                accountCode: row.account_code,
                balance: Number(row.balance),
                currency: entity.base_ccy
            });
        }
    }

    return trialBalances;
}

async function translateToPresentationCurrency(
    companyId: string,
    trialBalances: TrialBalanceRow[],
    presentCcy: string,
    year: number,
    month: number
): Promise<TrialBalanceRow[]> {
    // Get FX rates for the period (month-end rates)
    const { rows: fxRows } = await pool.query(`
    SELECT src_ccy, dst_ccy, rate
    FROM fx_admin_rates 
    WHERE company_id = $1 AND as_of_date = $2
  `, [companyId, `${year}-${month.toString().padStart(2, '0')}-01`]);

    const fxRates = new Map<string, number>();
    for (const row of fxRows) {
        fxRates.set(`${row.src_ccy}|${row.dst_ccy}`, Number(row.rate));
    }

    const translatedBalances: TrialBalanceRow[] = [];
    const ctaAmounts = new Map<string, number>(); // For CTA calculation

    for (const balance of trialBalances) {
        if (balance.currency === presentCcy) {
            translatedBalances.push(balance);
            continue;
        }

        const rateKey = `${balance.currency}|${presentCcy}`;
        const rate = fxRates.get(rateKey);

        if (!rate) {
            throw new Error(`FX rate not found for ${balance.currency} to ${presentCcy}`);
        }

        const translatedAmount = balance.balance * rate;
        const ctaAmount = translatedAmount - balance.balance;

        translatedBalances.push({
            entityCode: balance.entityCode,
            accountCode: balance.accountCode,
            balance: translatedAmount,
            currency: presentCcy
        });

        // Accumulate CTA
        const ctaKey = `${balance.entityCode}|${balance.accountCode}`;
        ctaAmounts.set(ctaKey, (ctaAmounts.get(ctaKey) || 0) + ctaAmount);
    }

    // Add CTA entries
    for (const [ctaKey, ctaAmount] of ctaAmounts) {
        if (Math.abs(ctaAmount) > 0.01) {
            const [entityCode, accountCode] = ctaKey.split('|');
            translatedBalances.push({
                entityCode: entityCode || '',
                accountCode: 'CTA', // CTA account
                balance: ctaAmount,
                currency: presentCcy
            });
        }
    }

    return translatedBalances;
}

async function applyIcEliminations(
    companyId: string,
    groupCode: string,
    balances: TrialBalanceRow[],
    year: number,
    month: number
): Promise<TrialBalanceRow[]> {
    // Get IC elimination account mapping
    const { rows: accountMapRows } = await pool.query(`
    SELECT account FROM consol_account_map 
    WHERE company_id = $1 AND purpose = 'IC_ELIM'
  `, [companyId]);

    const elimAccount = accountMapRows.length > 0
        ? accountMapRows[0].account
        : '9890';

    // Get posted IC eliminations for the period
    const { rows: elimRows } = await pool.query(`
    SELECT el.entity_code, el.cp_code, el.amount_base
    FROM ic_elim_line el
    JOIN ic_elim_run er ON el.run_id = er.id
    WHERE er.company_id = $1 AND er.group_code = $2 AND er.year = $3 AND er.month = $4
      AND er.mode = 'commit'
  `, [companyId, groupCode, year, month]);

    const eliminatedBalances = [...balances];

    // Apply eliminations
    for (const elim of elimRows) {
        // Add elimination entries
        eliminatedBalances.push({
            entityCode: elim.entity_code,
            accountCode: elimAccount,
            balance: -Number(elim.amount_base),
            currency: balances[0]?.currency || 'USD'
        });

        eliminatedBalances.push({
            entityCode: elim.cp_code,
            accountCode: elimAccount,
            balance: Number(elim.amount_base),
            currency: balances[0]?.currency || 'USD'
        });
    }

    return eliminatedBalances;
}

async function calculateMinorityInterest(
    companyId: string,
    groupCode: string,
    balances: TrialBalanceRow[],
    ownershipTree: any[]
): Promise<TrialBalanceRow[]> {
    // Get minority interest account mapping
    const { rows: accountMapRows } = await pool.query(`
    SELECT account FROM consol_account_map 
    WHERE company_id = $1 AND purpose = 'MINORITY'
  `, [companyId]);

    const minorityAccount = accountMapRows.length > 0
        ? accountMapRows[0].account
        : '3990';

    const minorityBalances = [...balances];
    const ownershipMap = new Map<string, number>();

    // Build ownership map
    for (const ownership of ownershipTree) {
        ownershipMap.set(ownership.childCode, Number(ownership.pct));
    }

    // Calculate minority interest for partially owned subsidiaries
    for (const balance of balances) {
        const ownershipPct = ownershipMap.get(balance.entityCode);
        if (ownershipPct && ownershipPct < 1.0) {
            const minorityPct = 1.0 - ownershipPct;
            const minorityAmount = balance.balance * minorityPct;

            if (Math.abs(minorityAmount) > 0.01) {
                minorityBalances.push({
                    entityCode: balance.entityCode,
                    accountCode: minorityAccount,
                    balance: minorityAmount,
                    currency: balance.currency
                });
            }
        }
    }

    return minorityBalances;
}

function generateConsolidatedPl(balances: TrialBalanceRow[]): Array<{ account: string; amount: number }> {
    const accountTotals = new Map<string, number>();

    for (const balance of balances) {
        // Only include P&L accounts (typically 4xxx and 5xxx)
        if (balance.accountCode.match(/^[45]\d{3}/)) {
            accountTotals.set(balance.accountCode, (accountTotals.get(balance.accountCode) || 0) + balance.balance);
        }
    }

    return Array.from(accountTotals.entries())
        .map(([account, amount]) => ({ account, amount }))
        .sort((a, b) => a.account.localeCompare(b.account));
}

function generateConsolidatedBs(balances: TrialBalanceRow[]): Array<{ account: string; amount: number }> {
    const accountTotals = new Map<string, number>();

    for (const balance of balances) {
        // Only include Balance Sheet accounts (typically 1xxx, 2xxx, 3xxx)
        if (balance.accountCode.match(/^[123]\d{3}/)) {
            accountTotals.set(balance.accountCode, (accountTotals.get(balance.accountCode) || 0) + balance.balance);
        }
    }

    return Array.from(accountTotals.entries())
        .map(([account, amount]) => ({ account, amount }))
        .sort((a, b) => a.account.localeCompare(b.account));
}

async function createConsolSummary(
    runId: string,
    summaries: { translation: number; icElim: number; minority: number }
): Promise<ConsolSummary[]> {
    const summaryLines: ConsolSummary[] = [];

    // Translation summary
    if (Math.abs(summaries.translation) > 0.01) {
        const id = ulid();
        await pool.query(`
      INSERT INTO consol_summary (id, run_id, component, label, amount)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, runId, 'TRANSLATION', 'Currency Translation Adjustment', summaries.translation]);

        summaryLines.push({
            id,
            runId,
            component: 'TRANSLATION',
            label: 'Currency Translation Adjustment',
            amount: summaries.translation
        });
    }

    // IC Elimination summary
    if (Math.abs(summaries.icElim) > 0.01) {
        const id = ulid();
        await pool.query(`
      INSERT INTO consol_summary (id, run_id, component, label, amount)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, runId, 'IC_ELIM', 'Intercompany Eliminations', summaries.icElim]);

        summaryLines.push({
            id,
            runId,
            component: 'IC_ELIM',
            label: 'Intercompany Eliminations',
            amount: summaries.icElim
        });
    }

    // Minority Interest summary
    if (Math.abs(summaries.minority) > 0.01) {
        const id = ulid();
        await pool.query(`
      INSERT INTO consol_summary (id, run_id, component, label, amount)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, runId, 'MINORITY', 'Minority Interest', summaries.minority]);

        summaryLines.push({
            id,
            runId,
            component: 'MINORITY',
            label: 'Minority Interest',
            amount: summaries.minority
        });
    }

    return summaryLines;
}

function calculateTranslationSummary(balances: TrialBalanceRow[]): number {
    return balances
        .filter(b => b.accountCode === 'CTA')
        .reduce((sum, b) => sum + b.balance, 0);
}

function calculateIcElimSummary(balances: TrialBalanceRow[]): number {
    return balances
        .filter(b => b.accountCode === '9890') // IC elimination account
        .reduce((sum, b) => sum + b.balance, 0);
}

function calculateMinoritySummary(balances: TrialBalanceRow[]): number {
    return balances
        .filter(b => b.accountCode === '3990') // Minority interest account
        .reduce((sum, b) => sum + b.balance, 0);
}

export async function getConsolRuns(
    companyId: string,
    groupCode?: string,
    year?: number,
    month?: number
): Promise<ConsolRun[]> {
    let query = `
    SELECT id, company_id, group_code, year, month, mode, present_ccy, created_at, created_by
    FROM consol_run 
    WHERE company_id = $1
  `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (groupCode) {
        query += ` AND group_code = $${paramIndex}`;
        params.push(groupCode);
        paramIndex++;
    }

    if (year) {
        query += ` AND year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
    }

    if (month) {
        query += ` AND month = $${paramIndex}`;
        params.push(month);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);

    const runs: ConsolRun[] = [];

    for (const row of rows) {
        // Get summary for this run
        const { rows: summaryRows } = await pool.query(`
      SELECT id, run_id, component, label, amount
      FROM consol_summary 
      WHERE run_id = $1
    `, [row.id]);

        runs.push({
            id: row.id,
            companyId: row.company_id,
            groupCode: row.group_code,
            year: row.year,
            month: row.month,
            mode: row.mode,
            presentCcy: row.present_ccy,
            createdAt: row.created_at,
            createdBy: row.created_by,
            summary: summaryRows.map(summaryRow => ({
                id: summaryRow.id,
                runId: summaryRow.run_id,
                component: summaryRow.component,
                label: summaryRow.label,
                amount: Number(summaryRow.amount)
            }))
        });
    }

    return runs;
}
