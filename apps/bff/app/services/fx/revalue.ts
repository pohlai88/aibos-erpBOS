import { pool } from "../../lib/db";
import { postJournal } from "../gl/journals";
import { getTrialBalances } from "../gl/trial-balance";
import { getAdminRateOr1 } from "../../reports/present";
import { ulid } from "ulid";

type RevalOpts = {
    companyId: string;
    year: number;
    month: number;
    dryRun: boolean;
    accounts?: string[];
    memo?: string;
    actor: string;
    baseCcy: string
};

export async function revalueMonetaryAccounts(opts: RevalOpts) {
    const asOf = new Date(Date.UTC(opts.year, opts.month, 0)); // month-end

    // 1) Pull TB balances by account+currency (monetary only)
    const tb = await getTrialBalances(opts.companyId, {
        year: opts.year,
        month: opts.month,
        monetaryOnly: true,
        groupByCurrency: true
    });

    // Optional subset
    const items = opts.accounts?.length ? tb.filter((x: any) => opts.accounts!.includes(x.account_code)) : tb;

    // 2) Build run
    const runId = ulid();
    await pool.query(
        `INSERT INTO fx_reval_run (id, company_id, year, month, mode, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [runId, opts.companyId, opts.year, opts.month, opts.dryRun ? "dry_run" : "commit", opts.actor]
    );

    const lines: any[] = [];

    // 3) For each (account, src_ccy) compute delta at admin rate
    for (const row of items) {
        const gl = row.account_code as string;
        const src = row.currency as string;             // original currency
        const srcAmt = Number(row.balance_src);         // monetary amount (e.g., foreign balance)
        const baseAmt = Number(row.balance_base);       // current base carrying amount

        if (!src || src.toUpperCase() === opts.baseCcy.toUpperCase()) continue; // skip base currency

        const rateNew = await getAdminRateOr1({
            companyId: opts.companyId,
            asOf,
            src,
            dst: opts.baseCcy
        });

        const rateOld = baseAmt === 0 ? rateNew : (baseAmt / (srcAmt || 1));   // derive existing carrying rate (avoid div/0)

        const newBase = srcAmt * rateNew;
        const delta = Number((newBase - baseAmt).toFixed(2));

        if (Math.abs(delta) < 0.005) continue;

        lines.push({
            id: ulid(),
            runId,
            glAccount: gl,
            currency: src,
            balanceBase: baseAmt,
            balanceSrc: srcAmt,
            rateOld,
            rateNew,
            deltaBase: delta
        });
    }

    if (lines.length) {
        // Insert reval lines
        for (const line of lines) {
            await pool.query(
                `INSERT INTO fx_reval_line (id, run_id, gl_account, currency, balance_base, balance_src, rate_old, rate_new, delta_base)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [line.id, line.runId, line.glAccount, line.currency, line.balanceBase, line.balanceSrc, line.rateOld, line.rateNew, line.deltaBase]
            );
        }
    }

    if (opts.dryRun) {
        return {
            run_id: runId,
            lines: lines.length,
            delta_total: round(lines.reduce((a, c) => a + c.deltaBase, 0))
        };
    }

    // 4) Idempotency lock per (period, account, ccy)
    for (const l of lines) {
        await pool.query(
            `INSERT INTO fx_reval_lock (company_id, year, month, gl_account, currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (company_id, year, month, gl_account, currency) DO NOTHING`,
            [opts.companyId, opts.year, opts.month, l.glAccount, l.currency]
        );
    }

    // 5) Group by account to post one JE per account
    const byAcc = new Map<string, any[]>();
    lines.forEach(l => {
        const arr = byAcc.get(l.glAccount) ?? [];
        arr.push(l);
        byAcc.set(l.glAccount, arr);
    });

    const journals: string[] = [];

    for (const [account, arr] of byAcc) {
        const delta = round(arr.reduce((a, c) => a + c.deltaBase, 0));
        if (Math.abs(delta) < 0.005) continue;

        // Lookup gain/loss accounts
        const { rows } = await pool.query(
            `SELECT unreal_gain_account, unreal_loss_account
       FROM fx_account_map
       WHERE company_id = $1 AND gl_account = $2
       LIMIT 1`,
            [opts.companyId, account]
        );

        if (rows.length === 0) continue;

        const map = rows[0];
        const memo = opts.memo ?? `FX revaluation ${opts.year}-${String(opts.month).padStart(2, "0")} ${account}`;
        const date = new Date(Date.UTC(opts.year, opts.month - 1, 28)); // posting date in month

        const gainAcc = map.unreal_gain_account;
        const lossAcc = map.unreal_loss_account;

        // If delta > 0, we need to DR account, CR unrealized gain
        const dr = delta > 0 ? account : lossAcc;
        const cr = delta > 0 ? gainAcc : account;
        const amt = Math.abs(delta);

        const je = {
            date,
            memo,
            lines: [
                { accountId: dr, debit: amt, credit: 0, description: `FX reval ${account}` },
                { accountId: cr, debit: 0, credit: amt, description: `FX reval ${account}` }
            ],
            tags: {
                module: "fx_reval",
                account,
                period: `${opts.year}-${String(opts.month).padStart(2, "0")}`
            }
        };

        const res = await postJournal(opts.companyId, je);
        journals.push(res.journalId);
    }

    const deltaTotal = round(lines.reduce((a, c) => a + c.deltaBase, 0));
    return {
        run_id: runId,
        lines: lines.length,
        journals: journals.length,
        delta_total: deltaTotal
    };
}

function round(n: number): number {
    return Number(n.toFixed(2));
}
