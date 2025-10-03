import { z } from "zod";
import { ISODate, Currency, Money } from "../shared/primitives.js";

export const PurchaseInvoiceLine = z.object({
    description: z.string().min(1),
    qty: z.number().positive(),
    unit_price: Money,
    tax_code: z.string().optional()
});

export const PurchaseInvoice = z.object({
    id: z.string(),
    company_id: z.string(),
    supplier_id: z.string(),
    doc_date: ISODate,
    currency: Currency,
    lines: z.array(PurchaseInvoiceLine).min(1),
    totals: z.object({
        total: Money,
        tax_total: Money,
        grand_total: Money
    })
});
export type PurchaseInvoice = z.infer<typeof PurchaseInvoice>;