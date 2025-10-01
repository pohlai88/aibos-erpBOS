import { pool } from "../../../lib/db";
import { getDisclosure } from "@aibos/policies";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

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

export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "reports:read");
    if (isResponse(capCheck)) return capCheck;

    const url = new URL(req.url);
    const currency = url.searchParams.get("currency") ?? "MYR";
    const tb = await loadTB(auth.company_id, currency);
    const policy = getDisclosure();

    function valOfAccounts(names: string[], sign: 1 | -1) {
        let v = 0;
        for (const n of names) {
            const r = tb.find(x => x.account_code === n);
            if (!r) continue;
            v += sign * (r.debit - r.credit);
        }
        return v;
    }

    // first pass: compute explicit lines
    const values: Record<string, number> = {};
    for (const s of policy.pl) {
        if ("accounts" in s) values[s.line] = valOfAccounts(s.accounts, s.sign);
    }

    // second pass: formulas
    for (const s of policy.pl) {
        if ("formula" in s) {
            const expr = s.formula.replace(/\b([A-Za-z ][A-Za-z ]+)\b/g, (_m: string, name: string) => (values[name] ?? 0).toString());
            // extremely simple evaluator: only + operations used above
            const v = expr.split("+").map((x: string) => Number(x.trim())).reduce((a: number, b: number) => a + b, 0);
            values[s.line] = v;
        }
    }

    const rows = policy.pl.map((s: any) => ({ line: s.line, value: Number(values[s.line] ?? 0).toFixed(2) }));
    const total = Number(values["Net Profit"] ?? 0).toFixed(2);

    return Response.json({ company_id: auth.company_id, currency, rows, total }, {
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