import { z } from "zod";

export const FxRateUpsert = z.object({
    as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    src_ccy: z.string().length(3),
    dst_ccy: z.string().length(3),
    rate: z.number().positive(),
});

export const FxRatesCsvImport = z.object({
    mapping: z.object({
        as_of_date: z.string().optional(),
        src_ccy: z.string().optional(),
        dst_ccy: z.string().optional(),
        rate: z.string().optional()
    }).optional()
});

export const FxRevalRequest = z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true),
    accounts: z.array(z.string()).optional(), // limit to subset
    memo: z.string().optional()
});

export const FxRevalResponse = z.object({
    run_id: z.string(),
    lines: z.number(),
    journals: z.number().optional(),
    delta_total: z.number()
});

export const FxRatesImportResponse = z.object({
    upserted: z.number(),
    errors: z.array(z.object({
        line: z.number(),
        error: z.string()
    }))
});
