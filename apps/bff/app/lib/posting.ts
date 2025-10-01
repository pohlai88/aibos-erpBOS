import { repo, tx } from "./db";
import { loadRule, get } from "@aibos/posting-rules";
import { computeBaseAmounts } from "./fx";

type Money = { amount: string; currency: string };
type JLine = {
    id: string;
    account_code: string; dc: "D" | "C"; amount: Money; currency: string;
    party_type?: "Customer" | "Supplier"; party_id?: string;
    base_amount?: Money; base_currency?: string;
    txn_amount?: Money; txn_currency?: string;
};

export async function postByRule(doctype: string, id: string, currency: string, company_id: string, doc: any) {
    // Convert doctype to kebab-case for filename lookup
    const ruleName = doctype === "StockIssue" ? "stock-issue" :
        doctype === "CustomerPayment" ? "customer-payment" :
            doctype === "SupplierPayment" ? "supplier-payment" :
                doctype.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
    const rule = loadRule(ruleName);
    const key = `${rule.doctype}:${id}`;

    const map = (kind: "debits" | "credits"): JLine[] =>
        rule[kind].map((l: any) => {
            const m = get(doc, l.amountField);
            if (!m) throw new Error(`Missing ${l.amountField}`);
            const jl: JLine = {
                id: crypto.randomUUID(),
                account_code: l.account,
                dc: kind === "debits" ? "D" : "C",
                amount: m,
                currency
            };
            if (l.party?.field) {
                const partyId = get(doc, l.party.field);
                if (partyId) { jl.party_type = l.party.type as any; jl.party_id = partyId; }
            }
            return jl;
        });

    const lines = [...map("debits"), ...map("credits")];

    // Compute base amounts for multi-currency support
    const docDate = doc.doc_date || new Date().toISOString();
    const baseAmounts = await computeBaseAmounts(company_id, docDate, lines.map(l => ({ amount: parseFloat(l.amount.amount), currency: l.currency })));

    // Populate multi-currency fields
    lines.forEach((line, index) => {
        line.base_amount = { amount: (baseAmounts.baseAmounts[index] ?? parseFloat(line.amount.amount)).toFixed(2), currency: baseAmounts.baseCurrency };
        line.base_currency = baseAmounts.baseCurrency;
        line.txn_amount = line.amount;
        line.txn_currency = line.currency;
    });

    const idActual = await tx.run(async (t) => {
        const existing = await repo.getIdByKey(key, t as any);
        if (existing) return existing;
        const res = await repo.insertJournal({
            company_id,
            posting_date: new Date().toISOString(),
            currency,
            source_doctype: rule.doctype,
            source_id: id,
            idempotency_key: key,
            base_currency: baseAmounts.baseCurrency,
            rate_used: baseAmounts.rateUsed,
            lines
        }, t as any);
        await repo.enqueueOutbox({ _meta: { name: "JournalPosted", version: 1, occurredAt: new Date().toISOString() }, journal_id: res.id }, t as any);
        return res.id;
    });

    return idActual;
}
