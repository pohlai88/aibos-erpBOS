import { pool } from "../../../lib/db";
import { getDisclosure, clearCache } from "@aibos/policies";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { convertToPresent } from "@aibos/policies";
import { buildPivotMatrix } from "../../../reports/pivot-matrix";
import { parseRollup, parseRollupLevel } from "../../../reports/pivot-params";

async function getPresentQuotes(base: string, present: string, onISO: string) {
    const { rows } = await pool.query(
        `select date::text as date, from_ccy as from, to_ccy as to, rate::text
       from fx_rate
      where from_ccy=$1 and to_ccy=$2 and date <= $3
      order by date desc
      limit 1`,
        [base, present, onISO]
    );
    return rows.map(r => ({ date: r.date, from: r.from, to: r.to, rate: Number(r.rate) }));
}

type TBRow = { account_code: string; debit: number; credit: number; cost_center_id?: string; project_id?: string; };

async function loadTB(company_id: string, currency: string, filters: { cost_center_id?: string; project_id?: string; pivot?: string; rollup?: string } = {}): Promise<TBRow[]> {
    let sql = `
    SELECT jl.account_code,
           SUM(CASE WHEN jl.dc='D' THEN 
             CASE 
               WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
               ELSE jl.amount::numeric 
             END
             ELSE 0 END) AS debit,
           SUM(CASE WHEN jl.dc='C' THEN 
             CASE 
               WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
               ELSE jl.amount::numeric 
             END
             ELSE 0 END) AS credit`;

    const params: any[] = [company_id, currency];
    let paramIndex = 3;

    // Add dimension filters and rollup logic
    if (filters.cost_center_id) {
        sql += `, jl.cost_center_id`;
    }
    if (filters.project_id) {
        sql += `, jl.project_id`;
    }

    // Add rollup support for cost center pivot
    if (filters.pivot === "cost_center" && filters.rollup && filters.rollup !== "none") {
        if (filters.rollup === "root") {
            sql += `, COALESCE(subpath(cc.path,0,1)::text, cc.code) as cost_center_rollup`;
        } else if (filters.rollup.startsWith("level:")) {
            const level = Number(filters.rollup.split(":")[1] || "0");
            sql += `, COALESCE(subpath(cc.path,0,${level + 1})::text, cc.code) as cost_center_rollup`;
        } else {
            sql += `, cc.code as cost_center_rollup`;
        }
    } else if (filters.pivot === "cost_center") {
        sql += `, cc.code as cost_center_rollup`;
    }

    sql += `
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id`;

    // Join cost center table for rollup support
    if (filters.pivot === "cost_center") {
        sql += ` LEFT JOIN dim_cost_center cc ON cc.id = jl.cost_center_id`;
    }

    sql += ` WHERE j.company_id = $1`;

    if (filters.cost_center_id) {
        sql += ` AND jl.cost_center_id = $${paramIndex}`;
        params.push(filters.cost_center_id);
        paramIndex++;
    }

    if (filters.project_id) {
        sql += ` AND jl.project_id = $${paramIndex}`;
        params.push(filters.project_id);
        paramIndex++;
    }

    sql += ` GROUP BY jl.account_code`;

    // Add dimension grouping for pivot
    if (filters.pivot === "cost_center") {
        sql += `, cost_center_rollup`;
    } else if (filters.pivot === "project") {
        sql += `, jl.project_id`;
    }

    const { rows } = await pool.query(sql, params);
    return rows.map(r => ({
        account_code: r.account_code,
        debit: Number(r.debit || 0),
        credit: Number(r.credit || 0),
        cost_center_id: r.cost_center_rollup || r.cost_center_id,
        project_id: r.project_id
    }));
}

export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "reports:read");
    if (isResponse(capCheck)) return capCheck;

    clearCache(); // Clear cache for development
    const url = new URL(req.url);

    // Get company base currency
    const company = await pool.query(`select base_currency from company where id=$1`, [auth.company_id]);
    const baseCurrency = company.rows[0]?.base_currency || "MYR";

    const currency = url.searchParams.get("currency") ?? baseCurrency;
    const present = url.searchParams.get("present"); // e.g. "USD"
    const asOf = (url.searchParams.get("as_of") ?? new Date().toISOString()).slice(0, 10);

    // Add full pivot parity with PL/BvA
    const pivot = url.searchParams.get("pivot"); // cost_center|project
    const pivotNullLabel = url.searchParams.get("pivot_null_label") ?? "Unassigned";
    const precision = Number.parseInt(url.searchParams.get("precision") ?? "2", 10);
    const includeGrandTotal = url.searchParams.get("grand_total") !== "false";
    const rollup = parseRollup(url.searchParams);

    // Dimension filters
    const costCenterId = url.searchParams.get("cost_center_id");
    const projectId = url.searchParams.get("project_id");

    const tb = await loadTB(auth.company_id, currency, {
        ...(costCenterId && { cost_center_id: costCenterId }),
        ...(projectId && { project_id: projectId }),
        ...(pivot && { pivot }),
        ...(rollup !== "none" && { rollup })
    });
    const policy = getDisclosure();

    function valOfAccounts(names: string[], sign: 1 | -1) {
        let v = 0;
        for (const n of names) {
            const r = tb.find(x => x.account_code === n);
            if (!r) continue;
            // For accounts with credit balances (Liabilities, Equity), show positive values
            v += sign * Math.abs(r.debit - r.credit);
        }
        return v;
    }

    const values: Record<string, number> = {};
    for (const s of policy.bs) {
        if ("accounts" in s) values[s.line] = valOfAccounts(s.accounts, s.sign);
    }
    for (const s of policy.bs) {
        if ("formula" in s) {
            const expr = s.formula.replace(/\b([A-Za-z ][A-Za-z ]+)\b/g, (_m: string, name: string) => (values[name] ?? 0).toString());
            // Handle both addition and subtraction
            const parts = expr.split(/([+-])/);
            let result = Number(parts[0]?.trim() || 0);
            for (let i = 1; i < parts.length; i += 2) {
                const operator = parts[i];
                const operand = Number(parts[i + 1]?.trim() || 0);
                if (operator === '+') result += operand;
                else if (operator === '-') result -= operand;
            }
            values[s.line] = result;
        }
    }

    // Optional presentation currency conversion
    let rate = null;
    let presentCurrency = currency;
    let convertedValues = values;

    if (present && present !== currency) {
        const quotes = await getPresentQuotes(currency, present, asOf);
        if (quotes.length) {
            rate = quotes[0]?.rate;
            presentCurrency = present;

            // Convert all values
            convertedValues = {};
            for (const [key, value] of Object.entries(values)) {
                convertedValues[key] = convertToPresent(value, currency, present, quotes, asOf) ?? value;
            }
        }
    }

    const rows = policy.bs.map((s: any) => ({
        line: s.line,
        value: Number(convertedValues[s.line] ?? 0).toFixed(2)
    }));
    const equationOK = Math.abs((convertedValues["Assets"] ?? 0) - (convertedValues["Liabilities"] ?? 0) - (convertedValues["Equity"] ?? 0)) < 0.005;

    // Handle matrix pivot response (M14.3)
    if (pivot) {
        // Get account names for matrix rows
        const accountNames = await pool.query(
            `SELECT code, name FROM account WHERE company_id = $1`,
            [auth.company_id]
        );
        const accountNameMap = new Map(
            accountNames.rows.map(r => [r.code, r.name])
        );

        // Adapt TB data to pivot format
        const lines = tb.map(r => ({
            account_code: r.account_code,
            account_name: accountNameMap.get(r.account_code) || r.account_code,
            cost_center: r.cost_center_id,
            project: r.project_id,
            amount: Number(r.debit - r.credit) || 0,
        }));

        const matrix = buildPivotMatrix(
            lines,
            (l) => `${l.account_code} ${l.account_name}`,
            {
                pivotKey: pivot as "cost_center" | "project",
                nullLabel: pivotNullLabel,
                precision: Number.isFinite(precision) ? precision : 2,
                grandTotal: includeGrandTotal,
                valueKey: "amount"
            }
        );

        return Response.json({
            meta: {
                pivot,
                pivot_null_label: pivotNullLabel,
                precision: Number.isFinite(precision) ? precision : 2,
                grand_total: includeGrandTotal,
                rollup: rollup !== "none" ? rollup : undefined
            },
            ...matrix,
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    return Response.json({
        company_id: auth.company_id,
        currency: presentCurrency,
        base_currency: baseCurrency,
        present_currency: rate ? present : currency,
        rate_used: rate,
        rows,
        equationOK
    }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
});

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}