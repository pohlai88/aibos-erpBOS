import type { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";
import type { LedgerRepo, TxManager } from "@aibos/ports";
import { genId, type JournalLine, insertJournal } from "./ledger";
import { loadRule, get } from "@aibos/posting-rules";

// map rule lines → JournalLine using SI doc
function mapLines(si: SalesInvoice, kind: "debits"|"credits"): JournalLine[] {
  const rule = loadRule("sales-invoice");
  const lines = rule[kind].map(l => {
    const money = get(si, l.amountField);
    if (!money) throw new Error(`Missing amountField ${l.amountField}`);
    const jl: JournalLine = {
      id: genId("JRL"),
      account_code: l.account,
      dc: kind === "debits" ? "D" : "C",
      amount: money,
      currency: si.currency,
    };
    if (l.party?.type && l.party.field) {
      const partyId = get(si, l.party.field);
      if (partyId) {
        jl.party_type = l.party.type as any;
        jl.party_id = partyId;
      }
    }
    return jl;
  });
  return lines;
}

type Deps = { repo?: LedgerRepo; tx?: TxManager };

export async function postSalesInvoice(si: SalesInvoice, deps: Deps = {}) {
  // derive idempotency key per rule
  const rule = loadRule("sales-invoice");
  const idParts = rule.idempotencyKey.map(k =>
    k === "doctype" ? "SalesInvoice" :
    k === "id" ? si.id :
    k === "version" ? "v1" :
    (get(si, k) ?? String(get(si as any, k)))
  );
  const key = idParts.join(":");

  const lines = [...mapLines(si, "debits"), ...mapLines(si, "credits")];

  if (deps.repo && deps.tx) {
    const id = await deps.tx.run(async (t) => {
      const existing = await deps.repo!.getIdByKey(key, t as any);
      if (existing) return existing;
      const res = await deps.repo!.insertJournal({
        company_id: si.company_id,
        posting_date: si.doc_date,
        currency: si.currency,
        source_doctype: "SalesInvoice",
        source_id: si.id,
        idempotency_key: key,
        lines
      }, t as any);
      await deps.repo!.enqueueOutbox({
        _meta:{ name:"JournalPosted", version:1, occurredAt:new Date().toISOString() },
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
      source: { doctype:"SalesInvoice", id: si.id },
      lines
    }, key);
    return { id: j.id };
  }
}