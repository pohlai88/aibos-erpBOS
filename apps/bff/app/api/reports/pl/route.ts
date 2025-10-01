import { pool } from "../../../lib/db";
import { getDisclosure } from "@aibos/policies";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { convertToPresent } from "@aibos/policies";

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

type TBRow = { account_code: string; debit: number; credit: number; };

async function loadTB(company_id: string, currency: string): Promise<TBRow[]> {
    const sql = `
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
             ELSE 0 END) AS credit
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id
    WHERE j.company_id = $1
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

    // Get company base currency
    const company = await pool.query(`select base_currency from company where id=$1`, [auth.company_id]);
    const baseCurrency = company.rows[0]?.base_currency || "MYR";

    const currency = url.searchParams.get("currency") ?? baseCurrency;
    const present = url.searchParams.get("present"); // e.g. "USD"
    const asOf = (url.searchParams.get("as_of") ?? new Date().toISOString()).slice(0, 10);

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

    const rows = policy.pl.map((s: any) => ({
        line: s.line,
        value: Number(convertedValues[s.line] ?? 0).toFixed(2)
    }));
    const total = Number(convertedValues["Net Profit"] ?? 0).toFixed(2);

    return Response.json({
        company_id: auth.company_id,
        currency: presentCurrency,
        base_currency: baseCurrency,
        present_currency: rate ? present : currency,
        rate_used: rate,
        rows,
        total
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