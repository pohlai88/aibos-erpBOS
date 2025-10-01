import { pool } from "../../../lib/db";
import { getDisclosure, clearCache } from "@aibos/policies";
import { requireAuth } from "../../../lib/auth";

type TBRow = { account_code: string; debit: number; credit: number; };

async function loadTB(company_id: string, currency: string): Promise<TBRow[]> {
    const sql = `
    SELECT jl.account_code,
           SUM(CASE WHEN jl.dc='D' THEN jl.amount::numeric ELSE 0 END) AS debit,
           SUM(CASE WHEN jl.dc='C' THEN jl.amount::numeric ELSE 0 END) AS credit
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id
    WHERE j.company_id = $1 AND j.currency = $2
    GROUP BY jl.account_code
  `;
    const { rows } = await pool.query(sql, [company_id, currency]);
    return rows.map(r => ({ account_code: r.account_code, debit: Number(r.debit || 0), credit: Number(r.credit || 0) }));
}

export async function GET(req: Request) {
    const auth = await requireAuth(req);
    clearCache(); // Clear cache for development
    const url = new URL(req.url);
    const currency = url.searchParams.get("currency") ?? "MYR";
    const tb = await loadTB(auth.company_id, currency);
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
            const parts = expr.split(/([+\-])/);
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

    const rows = policy.bs.map((s: any) => ({ line: s.line, value: Number(values[s.line] ?? 0).toFixed(2) }));
    const equationOK = Math.abs((values["Assets"] ?? 0) - (values["Liabilities"] ?? 0) - (values["Equity"] ?? 0)) < 0.005;

    return Response.json({ company_id: auth.company_id, currency, rows, equationOK }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

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
