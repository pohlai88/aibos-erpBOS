import { z } from "zod";
import { ISODate, Currency, Money } from "../shared/primitives.js";

export const SalesInvoiceLine = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unit_price: Money,
  tax_code: z.string().optional()
});

export const SalesInvoice = z.object({
  id: z.string(),            // ULID preferred; keep string for MVP
  company_id: z.string(),
  customer_id: z.string(),
  doc_date: ISODate,
  currency: Currency,
  lines: z.array(SalesInvoiceLine).min(1),
  totals: z.object({
    total: Money,
    tax_total: Money,
    grand_total: Money
  })
});
export type SalesInvoice = z.infer<typeof SalesInvoice>;
