import { pool } from "../../lib/db";

export interface AlertBreach {
    ruleId: string;
    account: string;
    cc?: string;
    project?: string;
    variancePct: number;
    amount: number;
    budget: number;
    actual: number;
}

export interface VarianceDataset {
    account_code: string;
    cost_center?: string;
    project?: string;
    budget: number;
    actual: number;
}

// Helper function to compare values based on comparator
function compare(comparator: string, value: number, threshold: number): boolean {
    switch (comparator) {
        case "gt": return value > threshold;
        case "lt": return value < threshold;
        case "gte": return value >= threshold;
        case "lte": return value <= threshold;
        case "abs_gt": return Math.abs(value) > threshold;
        case "abs_gte": return Math.abs(value) >= threshold;
        default: return false;
    }
}

// Fetch variance dataset for a specific period
async function fetchVarianceDataset(
    companyId: string,
    period: { year: number; month: number },
    scope: "month" | "qtr" | "ytd"
): Promise<VarianceDataset[]> {
    let dateFilter = "";
    const params = [companyId, period.year, period.month];

    switch (scope) {
        case "month": {
            dateFilter = `AND j.posting_date >= $2-01-01 AND j.posting_date < $2-02-01`;
            break;
        }
        case "qtr": {
            const quarterStart = Math.floor((period.month - 1) / 3) * 3 + 1;
            dateFilter = `AND j.posting_date >= $2-${quarterStart.toString().padStart(2, '0')}-01 
                    AND j.posting_date < $2-${(quarterStart + 3).toString().padStart(2, '0')}-01`;
            break;
        }
        case "ytd": {
            dateFilter = `AND j.posting_date >= $2-01-01 AND j.posting_date < $2-12-32`;
            break;
        }
    }

    const query = `
    WITH budget_data AS (
      SELECT 
        bl.account_code,
        bl.cost_center_id,
        bl.project_id,
        SUM(bl.amount_base) as budget_amount
      FROM budget_line bl
      WHERE bl.company_id = $1 ${dateFilter}
      GROUP BY bl.account_code, bl.cost_center_id, bl.project_id
    ),
    actual_data AS (
      SELECT 
        jl.account_code,
        jl.cost_center_id,
        jl.project_id,
        SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END) as actual_amount
      FROM journal_line jl
      JOIN journal j ON j.id = jl.journal_id
      WHERE j.company_id = $1 ${dateFilter}
      GROUP BY jl.account_code, jl.cost_center_id, jl.project_id
    )
    SELECT 
      COALESCE(b.account_code, a.account_code) as account_code,
      COALESCE(b.cost_center_id, a.cost_center_id) as cost_center,
      COALESCE(b.project_id, a.project_id) as project,
      COALESCE(b.budget_amount, 0) as budget,
      COALESCE(a.actual_amount, 0) as actual
    FROM budget_data b
    FULL OUTER JOIN actual_data a ON 
      b.account_code = a.account_code AND 
      b.cost_center_id = a.cost_center_id AND 
      b.project_id = a.project_id
    WHERE COALESCE(b.budget_amount, 0) != 0 OR COALESCE(a.actual_amount, 0) != 0
  `;

    const result = await pool.query(query, params);
    return result.rows;
}

// Dispatch notifications (stub implementation)
async function dispatchNotifications(breaches: AlertBreach[]): Promise<void> {
    // TODO: Implement actual email/webhook delivery
    console.log(`Alert: ${breaches.length} variance breaches detected`, breaches);

    for (const breach of breaches) {
        // In a real implementation, you would:
        // 1. Fetch the alert rule to get delivery configuration
        // 2. Send emails to configured recipients
        // 3. Call webhook URLs
        // 4. Log the notification for audit trail
        console.log(`Breach: ${breach.account} - ${breach.variancePct.toFixed(2)}% variance`);
    }
}

// Main alert evaluation function
export async function evaluateAlerts(
    companyId: string,
    period: { year: number; month: number }
): Promise<AlertBreach[]> {
    // Get active alert rules
    const rulesResult = await pool.query(
        `SELECT * FROM budget_alert_rule 
     WHERE company_id = $1 AND is_active = true`,
        [companyId]
    );

    if (rulesResult.rows.length === 0) {
        return [];
    }

    const breaches: AlertBreach[] = [];

    for (const rule of rulesResult.rows) {
        // Fetch variance dataset for this rule's scope
        const dataset = await fetchVarianceDataset(companyId, period, rule.period_scope);

        // Filter dataset based on rule criteria
        const filteredDataset = dataset.filter(row => {
            if (rule.account_code && row.account_code !== rule.account_code) return false;
            if (rule.cost_center && row.cost_center !== rule.cost_center) return false;
            if (rule.project && row.project !== rule.project) return false;
            return true;
        });

        // Evaluate each row against the rule
        for (const row of filteredDataset) {
            const variancePct = row.budget ? ((row.actual - row.budget) / row.budget) * 100 : 0;

            if (row.budget === 0) continue; // Skip if no budget to compare against

            const hit = compare(rule.comparator, variancePct, rule.threshold_pct);

            if (hit) {
                breaches.push({
                    ruleId: rule.id,
                    account: row.account_code,
                    ...(row.cost_center && { cc: row.cost_center }),
                    ...(row.project && { project: row.project }),
                    variancePct: Number(variancePct.toFixed(2)),
                    amount: row.actual - row.budget,
                    budget: row.budget,
                    actual: row.actual,
                });
            }
        }
    }

    // Dispatch notifications
    if (breaches.length > 0) {
        await dispatchNotifications(breaches);
    }

    return breaches;
}
