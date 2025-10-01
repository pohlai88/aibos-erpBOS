import { pool } from "../../../lib/db";
import { ok, unprocessable } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

type BudgetActualRow = {
    account_code: string;
    cost_center_id?: string;
    project_id?: string;
    budget: number;
    actual: number;
    variance: number;
    variance_pct: number;
};

export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "reports:read");
    if (isResponse(capCheck)) return capCheck;

    const url = new URL(req.url);
    const companyId = url.searchParams.get("company_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const budgetId = url.searchParams.get("budget_id");
    const costCenterId = url.searchParams.get("cost_center_id");
    const projectId = url.searchParams.get("project_id");
    const group = url.searchParams.get("group") || "account";

    if (!companyId || !from || !to || !budgetId) {
        return unprocessable("company_id, from, to, and budget_id are required");
    }

    if (companyId !== auth.company_id) {
        return unprocessable("Company ID mismatch");
    }

    // Get company base currency
    const company = await pool.query(`select currency from company where id=$1`, [companyId]);
    const baseCurrency = company.rows[0]?.currency || "MYR";

    // Parse group parameter
    const groupFields = group.split(",").map(f => f.trim());

    // Build actuals query
    let actualsSql = `
        select jl.account_code,
               jl.cost_center_id,
               jl.project_id,
               sum(case when jl.dc='D' then 
                 case 
                   when jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
                   ELSE jl.amount::numeric 
                 END
                 ELSE -case 
                   when jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
                   ELSE jl.amount::numeric 
                 END
                 END) as actual
        from journal_line jl
        join journal j on j.id = jl.journal_id
        where j.company_id = $1
          and j.posting_date >= $3 and j.posting_date < $4::date + 1
    `;

    const actualsParams: any[] = [companyId, baseCurrency, from, to];
    let paramIndex = 5;

    if (costCenterId) {
        actualsSql += ` and jl.cost_center_id = $${paramIndex}`;
        actualsParams.push(costCenterId);
        paramIndex++;
    }

    if (projectId) {
        actualsSql += ` and jl.project_id = $${paramIndex}`;
        actualsParams.push(projectId);
        paramIndex++;
    }

    actualsSql += ` group by jl.account_code`;

    if (groupFields.includes("cost_center")) {
        actualsSql += `, jl.cost_center_id`;
    }
    if (groupFields.includes("project")) {
        actualsSql += `, jl.project_id`;
    }

    // Build budgets query
    let budgetsSql = `
        select bl.account_code,
               bl.cost_center_id,
               bl.project_id,
               sum(bl.amount_base) as budget
        from budget_line bl
        where bl.company_id = $1
          and bl.budget_id = $${paramIndex}
          and bl.period_month between to_char($3::date,'YYYY-MM') and to_char($4::date,'YYYY-MM')
    `;

    const budgetsParams = [...actualsParams];
    budgetsParams.push(budgetId);
    paramIndex++;

    if (costCenterId) {
        budgetsSql += ` and bl.cost_center_id = $${paramIndex}`;
        budgetsParams.push(costCenterId);
        paramIndex++;
    }

    if (projectId) {
        budgetsSql += ` and bl.project_id = $${paramIndex}`;
        budgetsParams.push(projectId);
        paramIndex++;
    }

    budgetsSql += ` group by bl.account_code`;

    if (groupFields.includes("cost_center")) {
        budgetsSql += `, bl.cost_center_id`;
    }
    if (groupFields.includes("project")) {
        budgetsSql += `, bl.project_id`;
    }

    // Execute queries
    const actualsResult = await pool.query(actualsSql, actualsParams);
    const budgetsResult = await pool.query(budgetsSql, budgetsParams);

    // Create maps for joining
    const actualsMap = new Map<string, number>();
    const budgetsMap = new Map<string, number>();

    for (const row of actualsResult.rows) {
        const key = `${row.account_code}|${row.cost_center_id || ''}|${row.project_id || ''}`;
        actualsMap.set(key, Number(row.actual || 0));
    }

    for (const row of budgetsResult.rows) {
        const key = `${row.account_code}|${row.cost_center_id || ''}|${row.project_id || ''}`;
        budgetsMap.set(key, Number(row.budget || 0));
    }

    // Combine and calculate variances
    const allKeys = new Set([...actualsMap.keys(), ...budgetsMap.keys()]);
    const rows: BudgetActualRow[] = [];
    let totalBudget = 0;
    let totalActual = 0;

    for (const key of allKeys) {
        const parts = key.split('|');
        const account_code = parts[0] || '';
        const cost_center_id = parts[1] || undefined;
        const project_id = parts[2] || undefined;
        const budget = budgetsMap.get(key) || 0;
        const actual = actualsMap.get(key) || 0;
        const variance = actual - budget;
        const variance_pct = budget !== 0 ? variance / Math.abs(budget) : 0;

        rows.push({
            account_code,
            ...(cost_center_id && { cost_center_id }),
            ...(project_id && { project_id }),
            budget,
            actual,
            variance,
            variance_pct
        });

        totalBudget += budget;
        totalActual += actual;
    }

    const totalVariance = totalActual - totalBudget;
    const totalVariancePct = totalBudget !== 0 ? totalVariance / Math.abs(totalBudget) : 0;

    return ok({
        base_currency: baseCurrency,
        from,
        to,
        group: groupFields,
        rows,
        totals: {
            budget: totalBudget,
            actual: totalActual,
            variance: totalVariance,
            variance_pct: totalVariancePct
        }
    });
});
