import type { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";
import { insertJournal, genId, type JournalLine } from "./ledger";

export async function postSalesInvoice(si: SalesInvoice): Promise<{ id: string }> {
  const key = `SalesInvoice:${si.id}:v1`;

  // Build deterministic journal lines
  const lines: JournalLine[] = [
    {
      id: genId("JRL"),
      account_code: "Trade Receivables",
      dc: "D",
      amount: si.totals.grand_total,
      currency: si.currency,
      party_type: "Customer",
      party_id: si.customer_id
    },
    {
      id: genId("JRL"),
      account_code: "Sales",
      dc: "C",
      amount: si.totals.total,
      currency: si.currency
    },
    {
      id: genId("JRL"),
      account_code: "Output Tax",
      dc: "C",
      amount: si.totals.tax_total,
      currency: si.currency
    }
  ];

  const journal = await insertJournal(
    {
      company_id: si.company_id,
      posting_date: si.doc_date,
      currency: si.currency,
      source: { doctype: "SalesInvoice", id: si.id },
      lines
    },
    key
  );

  return { id: journal.id };
}
