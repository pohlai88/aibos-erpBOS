// M16.3: Unpost/Repost Service
// Handles unposting and reposting of asset depreciation/amortization

import { pool } from "../../lib/db";
import { postJournal } from "@/services/gl/journals";
import { UnpostRequest, UnpostResponse } from "@aibos/contracts";

/**
 * Unposts asset depreciation/amortization entries
 */
export async function unpostAssets(
    companyId: string,
    kind: "depr" | "amort",
    year: number,
    month: number,
    planIds?: string[],
    dryRun: boolean = true
): Promise<UnpostResponse> {
    const table = kind === "depr" ? "depr_schedule" : "amort_schedule";

    // Get posted entries for the period
    let query = `
    SELECT * FROM ${table}
    WHERE company_id = $1 AND year = $2 AND month = $3 AND booked_flag = true
  `;
    const params: any[] = [companyId, year, month];

    if (planIds?.length) {
        query += ` AND plan_id = ANY($${params.length + 1})`;
        params.push(planIds);
    }

    const result = await pool.query(query, params);
    const entries = result.rows;

    if (entries.length === 0) {
        return {
            dry_run: dryRun,
            kind,
            year,
            month,
            plans: 0,
            lines: 0,
            total_amount: 0,
            journals_to_reverse: [],
            sample: [],
        };
    }

    const totalAmount = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const distinctPlans = Array.from(new Set(entries.map(entry => entry.plan_id)));
    const journalsToReverse = entries.map(entry => entry.booked_journal_id).filter(Boolean);

    const sample = entries.slice(0, 5).map(entry => ({
        plan_id: entry.plan_id,
        amount: Number(entry.amount),
        journal_id: entry.booked_journal_id,
    }));

    if (dryRun) {
        return {
            dry_run: true,
            kind,
            year,
            month,
            plans: distinctPlans.length,
            lines: entries.length,
            total_amount: Number(totalAmount.toFixed(2)),
            journals_to_reverse: journalsToReverse,
            sample,
        };
    }

    // Execute actual unposting
    const reversedJournalIds: string[] = [];

    for (const entry of entries) {
        if (!entry.booked_journal_id) continue;

        try {
            // Create reversing journal entry
            const reversingJournal = await createReversingJournal(
                companyId,
                entry.booked_journal_id,
                year,
                month,
                kind
            );

            reversedJournalIds.push(reversingJournal.journal_id);

            // Update schedule entry
            await pool.query(
                `UPDATE ${table} 
         SET booked_flag = false, booked_journal_id = NULL, posted_ts = NULL
         WHERE id = $1`,
                [entry.id]
            );
        } catch (error) {
            console.error(`Failed to reverse journal ${entry.booked_journal_id}:`, error);
            // Continue with other entries
        }
    }

    return {
        dry_run: false,
        kind,
        year,
        month,
        plans: distinctPlans.length,
        lines: entries.length,
        total_amount: Number(totalAmount.toFixed(2)),
        journals_to_reverse: reversedJournalIds,
        sample,
    };
}

/**
 * Creates a reversing journal entry
 */
async function createReversingJournal(
    companyId: string,
    originalJournalId: string,
    year: number,
    month: number,
    kind: "depr" | "amort"
): Promise<{ journal_id: string }> {
    // Get original journal details
    const journalResult = await pool.query(
        `SELECT j.posting_date, j.currency, jl.account_code, jl.dc, jl.amount, jl.currency as line_currency
     FROM journal j
     JOIN journal_line jl ON j.id = jl.journal_id
     WHERE j.id = $1 AND j.company_id = $2`,
        [originalJournalId, companyId]
    );

    if (journalResult.rows.length === 0) {
        throw new Error(`Original journal ${originalJournalId} not found`);
    }

    const originalLines = journalResult.rows;
    const postingDate = originalLines[0].posting_date;
    const currency = originalLines[0].currency;

    // Create reversing journal entry
    const journal = {
        date: postingDate,
        memo: `Reversal of ${kind === "depr" ? "depreciation" : "amortization"} ${year}-${month.toString().padStart(2, "0")}`,
        lines: originalLines.map(line => ({
            accountId: line.account_code,
            debit: line.dc === "C" ? line.amount : 0, // Swap debit/credit
            credit: line.dc === "D" ? line.amount : 0,
            description: `Reversal of ${kind === "depr" ? "depreciation" : "amortization"} ${year}-${month.toString().padStart(2, "0")}`,
        })),
        tags: {
            module: kind === "depr" ? "capex" : "intangibles",
            operation: "unpost",
            original_journal_id: originalJournalId,
            period: `${year}-${month.toString().padStart(2, "0")}`,
        },
    };

    const result = await postJournal(companyId, journal);
    return { journal_id: result.journalId };
}

/**
 * Validates unposting safety
 */
export async function validateUnpostSafety(
    companyId: string,
    kind: "depr" | "amort",
    year: number,
    month: number,
    planIds?: string[]
): Promise<{ safe: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check if period is closed
    const periodResult = await pool.query(
        `SELECT status FROM accounting_period 
     WHERE company_id = $1 AND EXTRACT(YEAR FROM start_date) = $2 AND EXTRACT(MONTH FROM start_date) = $3`,
        [companyId, year, month]
    );

    if (periodResult.rows.length > 0 && periodResult.rows[0].status === "closed") {
        warnings.push(`Period ${year}-${month.toString().padStart(2, "0")} is closed`);
    }

    // Check if there are any posted entries
    const table = kind === "depr" ? "depr_schedule" : "amort_schedule";
    const entriesResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${table}
     WHERE company_id = $1 AND year = $2 AND month = $3 AND booked_flag = true`,
        [companyId, year, month]
    );

    if (Number(entriesResult.rows[0].count) === 0) {
        warnings.push(`No posted entries found for ${year}-${month.toString().padStart(2, "0")}`);
    }

    // Check for recent unposting activity
    const recentUnpostResult = await pool.query(
        `SELECT COUNT(*) as count FROM journal
     WHERE company_id = $1 AND tags->>'operation' = 'unpost' 
     AND tags->>'period' = $2 AND created_at > NOW() - INTERVAL '1 hour'`,
        [companyId, `${year}-${month.toString().padStart(2, "0")}`]
    );

    if (Number(recentUnpostResult.rows[0].count) > 0) {
        warnings.push(`Recent unposting activity detected for ${year}-${month.toString().padStart(2, "0")}`);
    }

    return {
        safe: warnings.length === 0,
        warnings,
    };
}
