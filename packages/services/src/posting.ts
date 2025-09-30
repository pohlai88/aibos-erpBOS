import type { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";
import type { LedgerRepo, TxManager } from "@aibos/ports";
import { genId, insertJournal, type JournalLine } from "./ledger";

type Deps = { repo?: LedgerRepo; tx?: TxManager };

export async function postSalesInvoice(si: SalesInvoice, deps: Deps = {}) {
  const key = `SalesInvoice:${si.id}:v1`;

  const lines: JournalLine[] = [
    { id: genId("JRL"), account_code: "Trade Receivables", dc: "D", amount: si.totals.grand_total, currency: si.currency, party_type: "Customer", party_id: si.customer_id },
    { id: genId("JRL"), account_code: "Sales", dc: "C", amount: si.totals.total, currency: si.currency },
    { id: genId("JRL"), account_code: "Output Tax", dc: "C", amount: si.totals.tax_total, currency: si.currency }
  ];

  // If repo+tx provided → use Postgres; else fall back to in-memory
  if (deps.repo && deps.tx) {
    const j = await deps.tx.run(async (t) => {
      if (await deps.repo!.existsByKey(key, t as any)) return { id: key }; // simplistic
      const res = await deps.repo!.insertJournal({
        company_id: si.company_id,
        posting_date: si.doc_date,
        currency: si.currency,
        source_doctype: "SalesInvoice",
        source_id: si.id,
        idempotency_key: key,
        lines
      }, t as any);
      await deps.repo!.enqueueOutbox({ _meta: { name: "JournalPosted", version: 1, occurredAt: new Date().toISOString() }, journal_id: res.id }, t as any);
      return { id: res.id };
    });
    return j;
  } else {
    const j = await insertJournal({ company_id: si.company_id, posting_date: si.doc_date, currency: si.currency, source: { doctype: "SalesInvoice", id: si.id }, lines }, key);
    return { id: j.id };
  }
}