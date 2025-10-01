import { z } from "zod";

export const receiptSchema = z.object({
    id: z.string().min(1),
    company_id: z.string().min(1),
    item_id: z.string().min(1),
    qty: z.number().positive(),
    unit_cost: z.number().nonnegative(),
    currency: z.enum(["MYR", "SGD", "USD", "VND", "IDR", "THB", "PHP"]), // extend as needed
});
export type ReceiptInput = z.infer<typeof receiptSchema>;

export const issueSchema = z.object({
    id: z.string().min(1),
    company_id: z.string().min(1),
    item_id: z.string().min(1),
    qty: z.number().positive(),
    currency: z.enum(["MYR", "SGD", "USD", "VND", "IDR", "THB", "PHP"]),
});
export type IssueInput = z.infer<typeof issueSchema>;
