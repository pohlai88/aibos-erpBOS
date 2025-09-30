import type { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";

// In-memory journal store for MVP
const journals = new Map<string, { id: string }>();

export async function postSalesInvoice(si: SalesInvoice): Promise<{ id: string }> {
  const key = `SalesInvoice:${si.id}:v1`;
  const existing = journals.get(key);
  if (existing) return existing;

  // Here you'd build proper journal lines & persist in DB.
  // For MVP demo, just synthesize a journal id.
  const journal = { id: `JRN-${Math.random().toString(36).slice(2,10)}` };
  journals.set(key, journal);
  return journal;
}
