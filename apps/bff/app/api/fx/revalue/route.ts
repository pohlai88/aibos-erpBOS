import { pool } from "../../../lib/db";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ok, unprocessable } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { getFxQuotesForDateOrBefore } from "../../../lib/fx";
import { DefaultFxPolicy } from "@aibos/policies";
import crypto from "node:crypto";

export const POST = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "periods:manage");
    if (isResponse(capCheck)) return capCheck;

    const body = await req.json() as {
        company_id: string;
        reval_date: string;
        scope?: string;
        method?: string;
    };

    if (!body.company_id || !body.reval_date) return unprocessable("company_id and reval_date required");

    // Check if revaluation already exists for this company/date/scope
    const existing = await pool.query(
        `select id from journal where company_id=$1 and posting_date=$2 and source_doctype='FxRevaluation' limit 1`,
        [body.company_id, body.reval_date]
    );

    if (existing.rows.length > 0) {
        return ok({ journal_id: existing.rows[0].id, message: "Revaluation already exists" });
    }

    // Get company base currency
    const company = await pool.query(`select base_currency from company where id=$1`, [body.company_id]);
    if (!company.rows.length) return unprocessable("Company not found");
    const baseCurrency = company.rows[0].base_currency;

    // Get open AR/AP balances in foreign currencies
    const openBalances = await pool.query(`
    select 
      jl.account_code,
      jl.party_type,
      jl.party_id,
      jl.currency,
      sum(case when jl.dc='D' then jl.amount else -jl.amount end) as balance,
      jl.txn_currency,
      jl.txn_amount
    from journal_line jl
    join journal j on j.id = jl.journal_id
    where j.company_id = $1
      and jl.currency != $2
      and jl.account_code in ('Trade Receivables', 'Trade Payables')
    group by jl.account_code, jl.party_type, jl.party_id, jl.currency, jl.txn_currency, jl.txn_amount
    having sum(case when jl.dc='D' then jl.amount else -jl.amount end) != 0
  `, [body.company_id, baseCurrency]);

    if (openBalances.rows.length === 0) {
        return ok({ journal_id: null, message: "No open foreign currency balances to revalue" });
    }

    // Create revaluation journal
    const journalId = crypto.randomUUID();
    const lines: any[] = [];
    let totalFxGain = 0;
    let totalFxLoss = 0;

    for (const balance of openBalances.rows) {
        const currentBaseAmount = balance.balance;
        const txnAmount = balance.txn_amount || balance.balance;
        const txnCurrency = balance.txn_currency || balance.currency;

        // Get FX rate for revaluation date
        const quotes = await getFxQuotesForDateOrBefore(txnCurrency, baseCurrency, body.reval_date);
        const rate = DefaultFxPolicy.selectRate(quotes, txnCurrency, baseCurrency, body.reval_date);

        if (!rate) continue; // Skip if no rate available

        const revalBaseAmount = txnAmount * rate;
        const fxDifference = revalBaseAmount - currentBaseAmount;

        if (Math.abs(fxDifference) < 0.01) continue; // Skip tiny differences

        // Add revaluation lines
        if (fxDifference > 0) {
            totalFxGain += fxDifference;
            lines.push({
                account_code: balance.account_code,
                dc: "D",
                amount: fxDifference,
                currency: baseCurrency,
                party_type: balance.party_type,
                party_id: balance.party_id,
                base_amount: fxDifference,
                base_currency: baseCurrency,
                txn_amount: fxDifference,
                txn_currency: baseCurrency
            });
            lines.push({
                account_code: "FX Gain",
                dc: "C",
                amount: fxDifference,
                currency: baseCurrency,
                base_amount: fxDifference,
                base_currency: baseCurrency,
                txn_amount: fxDifference,
                txn_currency: baseCurrency
            });
        } else {
            totalFxLoss += Math.abs(fxDifference);
            lines.push({
                account_code: balance.account_code,
                dc: "C",
                amount: Math.abs(fxDifference),
                currency: baseCurrency,
                party_type: balance.party_type,
                party_id: balance.party_id,
                base_amount: Math.abs(fxDifference),
                base_currency: baseCurrency,
                txn_amount: Math.abs(fxDifference),
                txn_currency: baseCurrency
            });
            lines.push({
                account_code: "FX Loss",
                dc: "D",
                amount: Math.abs(fxDifference),
                currency: baseCurrency,
                base_amount: Math.abs(fxDifference),
                base_currency: baseCurrency,
                txn_amount: Math.abs(fxDifference),
                txn_currency: baseCurrency
            });
        }
    }

    if (lines.length === 0) {
        return ok({ journal_id: null, message: "No revaluation required" });
    }

    // Insert journal
    await pool.query(
        `insert into journal(id, company_id, posting_date, currency, source_doctype, source_id, idempotency_key, base_currency, rate_used)
     values ($1,$2,$3,$4,'FxRevaluation',$5,$6,$7,$8)`,
        [journalId, body.company_id, body.reval_date, baseCurrency, `reval-${body.company_id}-${body.reval_date}`, `fx-reval-${body.company_id}-${body.reval_date}`, baseCurrency, 1.0]
    );

    // Insert journal lines
    for (const line of lines) {
        await pool.query(
            `insert into journal_line(id, journal_id, account_code, dc, amount, currency, party_type, party_id, base_amount, base_currency, txn_amount, txn_currency)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [crypto.randomUUID(), journalId, line.account_code, line.dc, line.amount, line.currency, line.party_type, line.party_id, line.base_amount, line.base_currency, line.txn_amount, line.txn_currency]
        );
    }

    return ok({
        journal_id: journalId,
        details: {
            items: openBalances.rows.length,
            total_fx_gain: totalFxGain,
            total_fx_loss: totalFxLoss,
            lines_created: lines.length
        }
    });
});
