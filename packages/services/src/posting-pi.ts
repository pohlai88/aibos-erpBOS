import type { PurchaseInvoice } from "@aibos/contracts/http/purchase/purchase-invoice.schema";
import type { LedgerRepo, TxManager } from "@aibos/ports";
import { genId, insertJournal, type JournalLine } from "./ledger";
import { loadRule, get } from "@aibos/posting-rules";
import { computeBaseAmounts } from "./fx";
import { computeTax } from "@aibos/policies";

function mapLines(pi: PurchaseInvoice, kind: "debits" | "credits"): JournalLine[] {
    const rule = loadRule("purchase-invoice");
    return rule[kind].map((l: any) => {
        const money = get(pi, l.amountField);
        if (!money) throw new Error(`Missing amountField ${l.amountField}`);
        const jl: JournalLine = {
            id: genId("JRL"),
            account_code: l.account,
            dc: kind === "debits" ? "D" : "C",
            amount: money,
            currency: pi.currency,
            txn_amount: money,
            txn_currency: pi.currency,
        };
        if (l.party?.type && l.party.field) {
            const partyId = get(pi, l.party.field);
            if (partyId) { jl.party_type = l.party.type as any; jl.party_id = partyId; }
        }
        return jl;
    });
}

type Deps = { repo?: LedgerRepo; tx?: TxManager; pool?: any; resolveTaxRule?: any; mapTaxAccount?: any };

export async function postPurchaseInvoice(pi: PurchaseInvoice, deps: Deps = {}) {
    const rule = loadRule("purchase-invoice");
    const key = `${rule.doctype}:${pi.id}:v1`;
    const lines: JournalLine[] = [...mapLines(pi, "debits"), ...mapLines(pi, "credits")];

    // Compute base amounts for multi-currency (only if pool is available)
    let fxData = { baseCurrency: pi.currency, rateUsed: 1.0, baseAmounts: lines.map(l => parseFloat(l.amount.amount)) };

    if (deps.pool) {
        try {
            fxData = await computeBaseAmounts(
                deps.pool,
                pi.company_id,
                pi.doc_date,
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
    if ((pi as any).tax_code_id && deps.resolveTaxRule && deps.mapTaxAccount && deps.pool) {
        try {
            const taxCodeId = (pi as any).tax_code_id;
            const taxRule = await deps.resolveTaxRule(deps.pool, pi.company_id, taxCodeId, pi.doc_date);
            
            if (taxRule) {
                // Calculate net amount (sum of non-tax lines)
                const netAmount = lines.reduce((sum, line) => {
                    // Skip tax accounts (we'll add them separately)
                    if (line.account_code?.includes("Tax")) return sum;
                    return sum + parseFloat(line.base_amount?.amount ?? line.amount.amount);
                }, 0);

                const tax = computeTax({
                    company_id: pi.company_id,
                    doc_date: pi.doc_date,
                    code_id: taxCodeId,
                    base_amount: netAmount,
                    precision: taxRule.precision,
                    rounding: taxRule.rounding,
                    rate: taxRule.rate
                });

                const inputAccount = await deps.mapTaxAccount(deps.pool, pi.company_id, taxCodeId, "input");
                if (inputAccount) {
                    const taxLine: JournalLine = {
                        id: genId("JRL"),
                        account_code: inputAccount,
                        dc: "D", // Debit for input tax
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
                company_id: pi.company_id,
                posting_date: pi.doc_date,
                currency: pi.currency,
                source_doctype: "PurchaseInvoice",
                source_id: pi.id,
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
            company_id: pi.company_id,
            posting_date: pi.doc_date,
            currency: pi.currency,
            source: { doctype: "PurchaseInvoice", id: pi.id },
            lines,
            base_currency: fxData.baseCurrency,
            rate_used: fxData.rateUsed
        }, key);
        return { id: j.id };
    }
}
