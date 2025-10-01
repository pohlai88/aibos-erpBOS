import { repo, tx } from "./db";
import { loadRule, get } from "@aibos/posting-rules";
import { computeBaseAmounts } from "./fx";
import { ensureDimValid, ensureDimsMeetAccountPolicy } from "./dimensions";

type Money = { amount: string; currency: string };
type JLine = {
    id: string;
    account_code: string; dc: "D" | "C"; amount: Money; currency: string;
    party_type?: "Customer" | "Supplier"; party_id?: string;
    base_amount?: Money; base_currency?: string;
    txn_amount?: Money; txn_currency?: string;
    // Dimensions (M14)
    cost_center_id?: string;
    project_id?: string;
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

    // Handle dimensions (M14) - apply doc-level defaults and validate
    const docCostCenter = get(doc, "cost_center_id");
    const docProject = get(doc, "project_id");

    for (const line of lines) {
        // Apply doc-level defaults if line doesn't have specific values
        const cc = line.cost_center_id ?? docCostCenter ?? null;
        const pr = line.project_id ?? docProject ?? null;

        // Validate dimensions exist and are active
        await ensureDimValid(cc, "cost_center");
        await ensureDimValid(pr, "project");

        // Validate dimensions meet account policy
        await ensureDimsMeetAccountPolicy(line.account_code, company_id, { cc, pr });

        // Update line with validated dimensions
        line.cost_center_id = cc;
        line.project_id = pr;
    }

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
