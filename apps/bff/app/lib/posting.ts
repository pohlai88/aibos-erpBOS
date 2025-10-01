import { repo, tx } from "./db";
import { loadRule, get } from "@aibos/posting-rules";

type Money = { amount: string; currency: string };
type JLine = {
    id: string;
    account_code: string; dc: "D" | "C"; amount: Money; currency: string;
    party_type?: "Customer" | "Supplier"; party_id?: string;
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
            lines
        }, t as any);
        await repo.enqueueOutbox({ _meta: { name: "JournalPosted", version: 1, occurredAt: new Date().toISOString() }, journal_id: res.id }, t as any);
        return res.id;
    });

    return idActual;
}
