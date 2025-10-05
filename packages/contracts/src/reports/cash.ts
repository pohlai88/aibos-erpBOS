import { z } from "zod";

export const cashMoneySchema = z.object({
    currency: z.string(),
    amount: z.number(),
});
export type CashMoney = z.infer<typeof cashMoneySchema>;

export const cashReportLineSchema = z.object({
    id: z.string(),
    name: z.string(),
    values: z.array(cashMoneySchema),   // month buckets or segments
    total: cashMoneySchema,             // precomputed total
});
export type CashReportLine = z.infer<typeof cashReportLineSchema>;

export const cashReportSchema = z.object({
    companyId: z.string(),
    period: z.object({
        year: z.number(),
        month: z.number().optional(),
    }),
    lines: z.array(cashReportLineSchema),
});
export type CashReport = z.infer<typeof cashReportSchema>;
