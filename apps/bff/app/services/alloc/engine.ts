import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { postJournal, JournalEntry } from "@/services/gl/journals";
import { AllocRule, AllocRuleTarget, AllocDriverValue, getActiveAllocRules, getAllocRuleTargets, getAllocDriverValues } from "./rules";

export interface AllocRunResult {
    runId: string;
    lines: AllocLine[];
    summary: {
        totalRulesProcessed: number;
        totalAmountAllocated: number;
        journalsPosted?: number;
    };
}

export interface AllocLine {
    id: string;
    ruleId: string;
    srcAccount?: string;
    srcCc?: string;
    targetCc: string;
    amountBase: number;
    driverCode?: string;
    driverValue?: number;
    method: string;
    note?: string;
}

export interface TrialBalanceRow {
    accountCode: string;
    costCenter?: string;
    project?: string;
    balance: number;
}

export async function runAllocation(
    companyId: string,
    year: number,
    month: number,
    dryRun: boolean,
    actor: string,
    ruleCodes?: string[],
    memo?: string
): Promise<AllocRunResult> {
    const runId = ulid();

    // Create run record
    await pool.query(`
    INSERT INTO alloc_run (id, company_id, year, month, mode, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [runId, companyId, year, month, dryRun ? 'dry_run' : 'commit', actor]);

    // Get active rules for the period
    const rules = await getActiveAllocRules(companyId, year, month);
    const filteredRules = ruleCodes
        ? rules.filter(rule => ruleCodes.includes(rule.code))
        : rules;

    // Get trial balance for the period
    const trialBalance = await getTrialBalance(companyId, year, month);

    const lines: AllocLine[] = [];
    let totalAmountAllocated = 0;
    let journalsPosted = 0;

    for (const rule of filteredRules) {
        // Check if already locked (committed)
        if (!dryRun) {
            const { rows: lockRows } = await pool.query(`
        SELECT 1 FROM alloc_lock 
        WHERE company_id = $1 AND year = $2 AND month = $3 AND rule_id = $4
      `, [companyId, year, month, rule.id]);

            if (lockRows.length > 0) {
                continue; // Skip already committed rule
            }
        }

        const ruleLines = await processAllocRule(
            companyId, year, month, rule, trialBalance, dryRun, actor, memo
        );

        lines.push(...ruleLines);
        totalAmountAllocated += ruleLines.reduce((sum, line) => sum + line.amountBase, 0);

        if (!dryRun && ruleLines.length > 0) {
            journalsPosted += await postAllocationJournal(
                companyId, year, month, rule, ruleLines, actor, memo
            );

            // Create lock
            await pool.query(`
        INSERT INTO alloc_lock (company_id, year, month, rule_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [companyId, year, month, rule.id]);
        }
    }

    // Store lines
    for (const line of lines) {
        await pool.query(`
      INSERT INTO alloc_line (
        id, run_id, rule_id, src_account, src_cc, target_cc, amount_base,
        driver_code, driver_value, method, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
            line.id, runId, line.ruleId, line.srcAccount, line.srcCc, line.targetCc,
            line.amountBase, line.driverCode, line.driverValue, line.method, line.note
        ]);
    }

    return {
        runId,
        lines,
        summary: {
            totalRulesProcessed: filteredRules.length,
            totalAmountAllocated,
            ...(dryRun ? {} : { journalsPosted })
        }
    };
}

async function processAllocRule(
    companyId: string,
    year: number,
    month: number,
    rule: AllocRule,
    trialBalance: TrialBalanceRow[],
    dryRun: boolean,
    actor: string,
    memo?: string
): Promise<AllocLine[]> {
    const lines: AllocLine[] = [];

    // Filter trial balance based on rule criteria
    const sourcePool = trialBalance.filter(row => {
        if (rule.srcAccount && !row.accountCode.includes(rule.srcAccount)) return false;
        if (rule.srcCcLike && row.costCenter && !row.costCenter.includes(rule.srcCcLike)) return false;
        if (rule.srcProject && row.project !== rule.srcProject) return false;
        return true;
    });

    const totalPool = sourcePool.reduce((sum, row) => sum + row.balance, 0);

    if (totalPool <= 0) {
        return lines; // No allocation needed
    }

    switch (rule.method) {
        case 'PERCENT':
            lines.push(...await processPercentRule(rule, totalPool, companyId, year, month));
            break;
        case 'RATE_PER_UNIT':
            lines.push(...await processRatePerUnitRule(rule, totalPool, companyId, year, month));
            break;
        case 'DRIVER_SHARE':
            lines.push(...await processDriverShareRule(rule, totalPool, companyId, year, month));
            break;
    }

    return lines;
}

async function processPercentRule(
    rule: AllocRule,
    totalPool: number,
    companyId: string,
    year: number,
    month: number
): Promise<AllocLine[]> {
    const targets = await getAllocRuleTargets(rule.id);
    const lines: AllocLine[] = [];

    for (const target of targets) {
        const amount = totalPool * target.percent;
        if (amount > 0) {
            lines.push({
                id: ulid(),
                ruleId: rule.id,
                ...(rule.srcAccount && { srcAccount: rule.srcAccount }),
                ...(rule.srcCcLike && { srcCc: rule.srcCcLike }),
                targetCc: target.targetCc,
                amountBase: amount,
                method: rule.method,
                note: `Percent allocation: ${(target.percent * 100).toFixed(1)}%`
            });
        }
    }

    return lines;
}

async function processRatePerUnitRule(
    rule: AllocRule,
    totalPool: number,
    companyId: string,
    year: number,
    month: number
): Promise<AllocLine[]> {
    if (!rule.driverCode || !rule.ratePerUnit) return [];

    const driverValues = await getAllocDriverValues(companyId, rule.driverCode, year, month);
    const lines: AllocLine[] = [];

    for (const driver of driverValues) {
        const amount = rule.ratePerUnit * driver.value;
        if (amount > 0) {
            lines.push({
                id: ulid(),
                ruleId: rule.id,
                ...(rule.srcAccount && { srcAccount: rule.srcAccount }),
                ...(rule.srcCcLike && { srcCc: rule.srcCcLike }),
                targetCc: driver.costCenter || driver.project || 'UNKNOWN',
                amountBase: amount,
                driverCode: rule.driverCode,
                driverValue: driver.value,
                method: rule.method,
                note: `Rate per unit: ${rule.ratePerUnit} × ${driver.value}`
            });
        }
    }

    return lines;
}

async function processDriverShareRule(
    rule: AllocRule,
    totalPool: number,
    companyId: string,
    year: number,
    month: number
): Promise<AllocLine[]> {
    if (!rule.driverCode) return [];

    const driverValues = await getAllocDriverValues(companyId, rule.driverCode, year, month);
    const totalDriverValue = driverValues.reduce((sum, driver) => sum + driver.value, 0);

    if (totalDriverValue <= 0) return [];

    const lines: AllocLine[] = [];

    for (const driver of driverValues) {
        const share = driver.value / totalDriverValue;
        const amount = totalPool * share;

        if (amount > 0) {
            lines.push({
                id: ulid(),
                ruleId: rule.id,
                ...(rule.srcAccount && { srcAccount: rule.srcAccount }),
                ...(rule.srcCcLike && { srcCc: rule.srcCcLike }),
                targetCc: driver.costCenter || driver.project || 'UNKNOWN',
                amountBase: amount,
                driverCode: rule.driverCode,
                driverValue: driver.value,
                method: rule.method,
                note: `Driver share: ${(share * 100).toFixed(1)}% of pool`
            });
        }
    }

    return lines;
}

async function getTrialBalance(
    companyId: string,
    year: number,
    month: number
): Promise<TrialBalanceRow[]> {
    const { rows } = await pool.query(`
    SELECT 
      jl.account_code as account_code,
      jl.cost_center_id as cost_center,
      jl.project_id as project,
      SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END) as balance
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id
    WHERE j.company_id = $1
      AND EXTRACT(YEAR FROM j.posting_date) = $2
      AND EXTRACT(MONTH FROM j.posting_date) = $3
    GROUP BY jl.account_code, jl.cost_center_id, jl.project_id
    HAVING SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END) != 0
  `, [companyId, year, month]);

    return rows.map(row => ({
        accountCode: row.account_code,
        costCenter: row.cost_center,
        project: row.project,
        balance: Number(row.balance)
    }));
}

async function postAllocationJournal(
    companyId: string,
    year: number,
    month: number,
    rule: AllocRule,
    lines: AllocLine[],
    actor: string,
    memo?: string
): Promise<number> {
    if (lines.length === 0) return 0;

    // Get account mapping
    const { rows: accountMapRows } = await pool.query(`
    SELECT target_account FROM alloc_account_map 
    WHERE company_id = $1 AND src_account = $2
  `, [companyId, rule.srcAccount || '']);

    const targetAccount = accountMapRows.length > 0
        ? accountMapRows[0].target_account
        : rule.srcAccount || '';

    // Create journal entry
    const journalLines = lines.map(line => ({
        accountId: targetAccount,
        debit: line.amountBase,
        credit: 0,
        description: `Allocation: ${rule.name} - ${line.note}`
    }));

    // Add credit line for source
    const totalAmount = lines.reduce((sum, line) => sum + line.amountBase, 0);
    journalLines.push({
        accountId: rule.srcAccount || '',
        debit: 0,
        credit: totalAmount,
        description: `Allocation: ${rule.name}`
    });

    const journalEntry: JournalEntry = {
        date: new Date(year, month - 1, 1), // First day of month
        memo: memo || `Allocation: ${rule.name}`,
        lines: journalLines,
        tags: { module: 'alloc', rule: rule.code }
    };

    const result = await postJournal(companyId, journalEntry);
    return result.linesPosted;
}

