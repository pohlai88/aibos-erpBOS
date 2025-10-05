import type { SalesInvoice } from "./_temp/shims";
import type { LedgerRepo, TxManager } from "@aibos/ports";
import { genId, type JournalLine, insertJournal } from "./ledger";
import { loadRule, get } from "@aibos/posting-rules";
import { computeBaseAmounts } from "./fx";
import { computeTax } from "@aibos/policies";

// map rule lines → JournalLine using SI doc
function mapLines(si: SalesInvoice, kind: "debits" | "credits"): JournalLine[] {
  const rule = loadRule("sales-invoice");
  const lines = rule[kind].map((l: any) => {
    const money = get(si, l.amountField) as any;
    if (!money) throw new Error(`Missing amountField ${l.amountField}`);
    const jl: JournalLine = {
      id: genId("JRL"),
      account_code: l.account,
      dc: kind === "debits" ? "D" : "C",
      amount: money,
      currency: si.currency,
      txn_amount: money,
      txn_currency: si.currency,
    };
    if (l.party?.type && l.party.field) {
      const partyId = get(si, l.party.field) as string;
      if (partyId) {
        jl.party_type = l.party.type as any;
        jl.party_id = partyId;
      }
    }
    return jl;
  });
  return lines;
}

type Deps = { repo?: LedgerRepo; tx?: TxManager; pool?: any; resolveTaxRule?: any; mapTaxAccount?: any };

export async function postSalesInvoice(si: SalesInvoice, deps: Deps = {}) {
  // derive idempotency key per rule
  const rule = loadRule("sales-invoice");
  const idParts = rule.idempotencyKey.map((k: string) =>
    k === "doctype" ? "SalesInvoice" :
      k === "id" ? si.id :
        k === "version" ? "v1" :
          (get(si, k) ?? String(get(si as any, k)))
  );
  const key = idParts.join(":");

  const lines = [...mapLines(si, "debits"), ...mapLines(si, "credits")];

  // Compute base amounts for multi-currency (only if pool is available)
  let fxData = { baseCurrency: si.currency, rateUsed: 1.0, baseAmounts: lines.map(l => parseFloat(l.amount.amount)) };

  if (deps.pool) {
    try {
      fxData = await computeBaseAmounts(
        deps.pool,
        si.company_id,
        si.doc_date,
        lines.map(l => ({ amount: parseFloat(l.amount.amount), currency: l.currency }))
      );
    } catch (error) {
      console.warn("FX computation failed, using transaction currency:", error);
    }
  }

  // Update lines with base amounts
  lines.forEach((line, index) => {
    const baseAmount = fxData.baseAmounts[index] ?? parseFloat(line.amount.amount);
    line.base_amount = { amount: baseAmount.toFixed(2), currency: fxData.baseCurrency };
    line.base_currency = fxData.baseCurrency;
  });

  // Add tax computation if tax_code_id is provided and helpers are available
  if ((si as any).tax_code_id && deps.resolveTaxRule && deps.mapTaxAccount && deps.pool) {
    try {
      const taxCodeId = (si as any).tax_code_id;
      const taxRule = await deps.resolveTaxRule(deps.pool, si.company_id, taxCodeId, si.doc_date);

      if (taxRule) {
        // Calculate net amount (sum of non-tax lines)
        const netAmount = lines.reduce((sum, line) => {
          // Skip tax accounts (we'll add them separately)
          if (line.account_code?.includes("Tax")) return sum;
          return sum + parseFloat(line.base_amount?.amount ?? line.amount.amount);
        }, 0);

        const tax = computeTax({
          company_id: si.company_id,
          doc_date: si.doc_date,
          code_id: taxCodeId,
          base_amount: netAmount,
          precision: taxRule.precision,
          rounding: taxRule.rounding,
          rate: taxRule.rate
        });

        const outputAccount = await deps.mapTaxAccount(deps.pool, si.company_id, taxCodeId, "output");
        if (outputAccount) {
          const taxLine: JournalLine = {
            id: genId("JRL"),
            account_code: outputAccount,
            dc: "C", // Credit for output tax
            amount: { amount: tax.tax_amount.toFixed(2), currency: fxData.baseCurrency },
            currency: fxData.baseCurrency,
            base_amount: { amount: tax.tax_amount.toFixed(2), currency: fxData.baseCurrency },
            base_currency: fxData.baseCurrency,
            txn_amount: { amount: tax.tax_amount.toFixed(2), currency: fxData.baseCurrency },
            txn_currency: fxData.baseCurrency,
            meta: { tax_code_id: taxCodeId, rate: taxRule.rate }
          };
          lines.push(taxLine);
        }
      }
    } catch (error) {
      console.warn("Tax computation failed:", error);
    }
  }

  if (deps.repo && deps.tx) {
    const id = await deps.tx.run(async (t: any) => {
      const existing = await deps.repo!.getIdByKey(key, t as any);
      if (existing) return existing;
      const res = await deps.repo!.insertJournal({
        company_id: si.company_id,
        posting_date: si.doc_date,
        currency: si.currency,
        source_doctype: "SalesInvoice",
        source_id: si.id,
        idempotency_key: key,
        lines,
        base_currency: fxData.baseCurrency,
        rate_used: fxData.rateUsed
      }, t as any);
      await deps.repo!.enqueueOutbox({
        _meta: { name: "JournalPosted", version: 1, occurredAt: new Date().toISOString() },
        journal_id: res.id
      }, t as any);
      return res.id;
    });
    return { id };
  } else {
    const j = await insertJournal({
      company_id: si.company_id,
      posting_date: si.doc_date,
      currency: si.currency,
      source: { doctype: "SalesInvoice", id: si.id },
      lines,
      base_currency: fxData.baseCurrency,
      rate_used: fxData.rateUsed
    }, key);
    return { id: j.id };
  }
}