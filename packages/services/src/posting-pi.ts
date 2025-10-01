import type { PurchaseInvoice } from "@aibos/contracts/http/purchase/purchase-invoice.schema";
import type { LedgerRepo, TxManager } from "@aibos/ports";
import { genId, insertJournal, type JournalLine } from "./ledger";
import { loadRule, get } from "@aibos/posting-rules";

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
            currency: pi.currency
        };
        if (l.party?.type && l.party.field) {
            const partyId = get(pi, l.party.field);
            if (partyId) { jl.party_type = l.party.type as any; jl.party_id = partyId; }
        }
        return jl;
    });
}

type Deps = { repo?: LedgerRepo; tx?: TxManager };

export async function postPurchaseInvoice(pi: PurchaseInvoice, deps: Deps = {}) {
    const rule = loadRule("purchase-invoice");
    const key = `${rule.doctype}:${pi.id}:v1`;
    const lines: JournalLine[] = [...mapLines(pi, "debits"), ...mapLines(pi, "credits")];

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
                lines
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
            lines
        }, key);
        return { id: j.id };
    }
}
