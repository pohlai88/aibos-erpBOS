import { pool } from "../../../lib/db";
import { ok, badRequest, unauthorized, forbidden, unprocessable } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { parseISO, addMonths, startOfMonth, format } from "date-fns";

type BudgetActualRow = {
    account_code: string;
    cost_center_id?: string;
    project_id?: string;
    budget: number;
    actual: number;
    variance: number;
    variance_pct: number;
};

/**
 * GET /api/reports/budget-vs-actual
 * qps: company_id, from, to, budget_id
 * optional: cost_center_id, project_id, group=account | account,cost_center | account,project
 */
export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "reports:read");
    if (isResponse(capCheck)) return capCheck;

    const url = new URL(req.url);
    const company_id = url.searchParams.get("company_id") ?? "";
    const fromStr = url.searchParams.get("from") ?? "";
    const toStr = url.searchParams.get("to") ?? "";
    const budget_id = url.searchParams.get("budget_id") ?? "";
    const cc = url.searchParams.get("cost_center_id"); // can be null
    const prj = url.searchParams.get("project_id");     // can be null
    const groupParam = (url.searchParams.get("group") ?? "account").toLowerCase();
    const pivot = (url.searchParams.get("pivot") ?? "").toLowerCase(); // "cost_center" | "project" | ""
    const pivotNullLabel = url.searchParams.get("pivot_null_label") ?? "__NULL__";
    const precision = parseInt(url.searchParams.get("precision") ?? "2");
    const grandTotal = url.searchParams.get("grand_total") !== "false";
    
    // M14.4: Scenario and compare_to parameters
    const scenario = url.searchParams.get("scenario") ?? "working"; // baseline|working|<version_code>
    const compareTo = url.searchParams.get("compare_to") ?? scenario; // For budget side comparison

    if (auth.company_id !== company_id) return forbidden("company mismatch");

    if (!company_id || !fromStr || !toStr || !budget_id) {
        return badRequest("company_id, from, to, budget_id are required");
    }

    // M14.4: Resolve scenario and compare_to to version IDs
    let scenarioVersionId: string | null = null;
    let compareToVersionId: string | null = null;

    // Helper function to resolve scenario to version ID
    const resolveScenario = async (scenarioParam: string): Promise<string | null> => {
        if (scenarioParam === "baseline") {
            const result = await pool.query(
                `SELECT id FROM budget_version WHERE company_id = $1 AND is_baseline = true AND year = $2`,
                [company_id, new Date(from).getFullYear()]
            );
            return result.rows[0]?.id || null;
        } else if (scenarioParam === "working") {
            const result = await pool.query(
                `SELECT id FROM budget_version WHERE company_id = $1 AND status = 'draft' AND year = $2 ORDER BY updated_at DESC LIMIT 1`,
                [company_id, new Date(from).getFullYear()]
            );
            return result.rows[0]?.id || null;
        } else {
            // Assume it's a version code
            const result = await pool.query(
                `SELECT id FROM budget_version WHERE company_id = $1 AND code = $2`,
                [company_id, scenarioParam]
            );
            return result.rows[0]?.id || null;
        }
    };

    scenarioVersionId = await resolveScenario(scenario);
    compareToVersionId = await resolveScenario(compareTo);

    if (!scenarioVersionId) {
        return badRequest(`Scenario '${scenario}' not found or no budget version available`);
    }

    let from: Date, to: Date;
    try {
        from = parseISO(fromStr);
        to = parseISO(toStr);
    } catch {
        return badRequest("invalid from/to");
    }

    // Normalize group keys and build SQL grouping
    const groupKeys = groupParam.split(",").map(s => s.trim()).filter(Boolean);
    // Supported keys
    const supported = new Set(["account", "cost_center", "project"]);
    for (const g of groupKeys) if (!supported.has(g)) return badRequest(`unsupported group key: ${g}`);

    // Will group by at least account_code
    const groupByCols: string[] = ["account_code"];
    if (groupKeys.includes("cost_center")) groupByCols.push("cost_center_id");
    if (groupKeys.includes("project")) groupByCols.push("project_id");

    // Build month buckets list for budgets (YYYY-MM)
    const months: string[] = [];
    let cur = startOfMonth(from);
    const toEnd = startOfMonth(addMonths(startOfMonth(to), 1)); // exclusive
    while (cur < toEnd) {
        months.push(format(cur, "yyyy-MM"));
        cur = addMonths(cur, 1);
    }

    // NULL-friendly join strategy: coalesce dimension keys to '' on both sides
    // Actuals sign rule must match PL (DR - CR).
    // NOTE: cost_center/project filters are applied with IS NULL logic as well.

    const params: any[] = [];
    let p = 0;

    const actualsSQL = `
        select
            jl.account_code,
            coalesce(jl.cost_center_id, '') as cost_center_id,
            coalesce(jl.project_id,     '') as project_id,
            sum(case when jl.dc='DR' then jl.base_amount else -jl.base_amount end) as actual
        from journal_line jl
        join journal j on j.id = jl.journal_id
        where j.company_id = $${++p}               -- $1
            and j.posting_date >= $${++p}::date      -- $2
            and j.posting_date <  $${++p}::date + 1  -- $3 (inclusive end date)
            ${cc ? `and jl.cost_center_id = $${++p}` : ``}  -- $4?
            ${prj ? `and jl.project_id     = $${++p}` : ``}  -- $5?
        group by 1,2,3
    `;
    params.push(company_id, fromStr, toStr);
    if (cc) params.push(cc);
    if (prj) params.push(prj);

    // Budgets across month buckets
    const monthArraySQL = `select unnest($${++p}::text[]) as period_month`; // $n months[]
    const monthsParamIndex = p;
    params.push(months);

    const budgetsSQL = `
        with months as (${monthArraySQL})
        select
            bl.account_code,
            coalesce(bl.cost_center_id, '') as cost_center_id,
            coalesce(bl.project_id,     '') as project_id,
            sum(bl.amount_base) as budget
        from budget_line bl
        join budget b on b.id = bl.budget_id and b.company_id = bl.company_id
        join months m on m.period_month = bl.period_month
        where bl.company_id = $${++p}   -- $n+1 company
            and bl.budget_id  = $${++p}   -- $n+2 budget
            ${compareToVersionId ? `and bl.version_id = $${++p}` : `and bl.version_id IS NULL`}  -- $n+3 version
            ${cc ? `and bl.cost_center_id = $${++p}` : ``}
            ${prj ? `and bl.project_id     = $${++p}` : ``}
        group by 1,2,3
    `;
    params.push(company_id, budget_id);
    if (compareToVersionId) params.push(compareToVersionId);
    if (cc) params.push(cc);
    if (prj) params.push(prj);

    // Outer join on normalized keys
    const outerSQL = `
        with
        A as (${actualsSQL}),
        B as (${budgetsSQL})
        select
            coalesce(A.account_code, B.account_code)     as account_code,
            coalesce(A.cost_center_id, B.cost_center_id) as cost_center_id,
            coalesce(A.project_id,     B.project_id)     as project_id,
            coalesce(B.budget, 0) as budget,
            coalesce(A.actual, 0) as actual
        from A
        full outer join B
            on A.account_code   = B.account_code
            and A.cost_center_id = B.cost_center_id
            and A.project_id     = B.project_id
    `;

    // Execute
    const { rows } = await pool.query(outerSQL, params);

    // Shape rows per requested grouping; compute variance safely
    type Row = {
        account_code: string;
        cost_center_id?: string | null;
        project_id?: string | null;
        budget: string | number; // pg numeric
        actual: string | number;
    }

    const shaped = rows.map((r: Row) => {
        // NULL-normalize back (we had '' while joining)
        const account_code = r.account_code ?? "";
        const cost_center_id = r.cost_center_id === "" ? null : r.cost_center_id ?? null;
        const project_id = r.project_id === "" ? null : r.project_id ?? null;

        const budget = Number(r.budget ?? 0);
        const actual = Number(r.actual ?? 0);
        const variance = actual - budget;
        const variance_pct = budget === 0 ? null : variance / Math.abs(budget);

        const base: any = { account_code, budget, actual, variance, variance_pct };

        // Include dimension fields for grouping OR pivoting
        const includeCostCenter = groupByCols.includes("cost_center_id") || pivot === "cost_center";
        const includeProject = groupByCols.includes("project_id") || pivot === "project";

        if (includeCostCenter) base.cost_center_id = cost_center_id;
        if (includeProject) base.project_id = project_id;

        return base;
    });

    // Totals (no dimension keys)
    const totals = shaped.reduce((acc: any, r: any) => {
        acc.budget += r.budget ?? 0;
        acc.actual += r.actual ?? 0;
        acc.variance += r.variance ?? 0;
        return acc;
    }, { budget: 0, actual: 0, variance: 0 as number });

    const totals_pct = totals.budget === 0 ? null : totals.variance / Math.abs(totals.budget);

    // Handle pivot functionality
    if (pivot === "cost_center" || pivot === "project") {
        const axisKey = pivot === "cost_center" ? "cost_center_id" : "project_id";

        // collect distinct pivot keys (null → pivotNullLabel for display; keep null internal)
        const pivotKeys: (string | null)[] = [];
        const seen = new Set<string>();
        for (const r of shaped) {
            const k = (r as any)[axisKey] ?? null;
            const sk = k ?? pivotNullLabel;
            if (!seen.has(sk)) { seen.add(sk); pivotKeys.push(k); }
        }

        // group rows by account_code then by pivot key
        type Agg = Record<string, { budget: number; actual: number }>;
        const byAccount: Record<string, Agg> = {};
        for (const r of shaped) {
            const acct = r.account_code as string;
            const k = ((r as any)[axisKey] ?? null) as (string | null);
            if (!byAccount[acct]) byAccount[acct] = {};
            const accountData = byAccount[acct];
            if (accountData) {
                const cell = accountData[k ?? pivotNullLabel] ?? { budget: 0, actual: 0 };
                cell.budget += r.budget ?? 0;
                cell.actual += r.actual ?? 0;
                accountData[k ?? pivotNullLabel] = cell;
            }
        }

        // build matrix rows
        const matrixRows = Object.entries(byAccount).map(([account_code, axisAgg]) => {
            const row: any = { account_code };
            let rowBudget = 0, rowActual = 0;
            for (const k of pivotKeys) {
                const keyStr = k ?? pivotNullLabel;
                const { budget = 0, actual = 0 } = axisAgg[keyStr] ?? {};
                const variance = actual - budget;
                const variance_pct = budget === 0 ? null : variance / Math.abs(budget);
                // write column set under a stable key
                row[keyStr] = { budget, actual, variance, variance_pct };
                rowBudget += budget; rowActual += actual;
            }
            // optional row totals
            row.total = {
                budget: rowBudget,
                actual: rowActual,
                variance: rowActual - rowBudget,
                variance_pct: rowBudget === 0 ? null : (rowActual - rowBudget) / Math.abs(rowBudget),
            };
            return row;
        });

        // column totals
        const totalsByPivot: Record<string, { budget: number; actual: number; variance: number; variance_pct: number | null }> = {};
        for (const k of pivotKeys) {
            const keyStr = k ?? pivotNullLabel;
            let b = 0, a = 0;
            for (const r of matrixRows) {
                const cell = r[keyStr] || { budget: 0, actual: 0 };
                b += cell.budget || 0;
                a += cell.actual || 0;
            }
            const v = a - b;
            totalsByPivot[keyStr] = {
                budget: b, actual: a, variance: v, variance_pct: b === 0 ? null : v / Math.abs(b),
            };
        }

        return ok({
            base_currency: "MYR", // TODO: get from company
            from: fromStr,
            to: toStr,
            budget_id,
            pivot_axis: axisKey,                    // "cost_center_id" or "project_id"
            pivot_keys: pivotKeys,                  // e.g. ["CC-OPS","CC-RND", null]
            rows: matrixRows,                       // row per account, columns per pivot key
            totals_by_pivot: totalsByPivot,         // column totals
        });
    }

    return ok({
        base_currency: "MYR", // TODO: get from company
        from: fromStr,
        to: toStr,
        budget_id,
        group: groupKeys.length ? groupKeys : ["account"],
        months,                          // helpful for debugging
        rows: shaped,
        totals: { ...totals, variance_pct: totals_pct }
    });
});
