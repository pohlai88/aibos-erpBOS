import { z } from "zod";
export declare const SalesInvoiceLine: z.ZodObject<{
    description: z.ZodString;
    qty: z.ZodNumber;
    unit_price: any;
    tax_code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    description?: unknown;
    qty?: unknown;
    unit_price?: unknown;
    tax_code?: unknown;
}, {
    [x: string]: any;
    description?: unknown;
    qty?: unknown;
    unit_price?: unknown;
    tax_code?: unknown;
}>;
export declare const SalesInvoice: z.ZodObject<{
    id: z.ZodString;
    company_id: z.ZodString;
    customer_id: z.ZodString;
    doc_date: any;
    currency: any;
    lines: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        qty: z.ZodNumber;
        unit_price: any;
        tax_code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        [x: string]: any;
        description?: unknown;
        qty?: unknown;
        unit_price?: unknown;
        tax_code?: unknown;
    }, {
        [x: string]: any;
        description?: unknown;
        qty?: unknown;
        unit_price?: unknown;
        tax_code?: unknown;
    }>, "many">;
    totals: z.ZodObject<{
        total: any;
        tax_total: any;
        grand_total: any;
    }, "strip", z.ZodTypeAny, {
        [x: string]: any;
        total?: unknown;
        tax_total?: unknown;
        grand_total?: unknown;
    }, {
        [x: string]: any;
        total?: unknown;
        tax_total?: unknown;
        grand_total?: unknown;
    }>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    id?: unknown;
    company_id?: unknown;
    customer_id?: unknown;
    doc_date?: unknown;
    currency?: unknown;
    lines?: unknown;
    totals?: unknown;
}, {
    [x: string]: any;
    id?: unknown;
    company_id?: unknown;
    customer_id?: unknown;
    doc_date?: unknown;
    currency?: unknown;
    lines?: unknown;
    totals?: unknown;
}>;
export type SalesInvoice = z.infer<typeof SalesInvoice>;
