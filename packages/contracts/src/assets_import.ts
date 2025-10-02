// M16.2: CSV Import & Bulk Posting Contracts
// Zod schemas for CSV import and bulk posting operations

import { z } from "zod";

export const CsvColumnMap = z.object({
    // CSV column headers (case sensitive unless you normalize)
    class: z.string().optional(),          // "asset_class" for capex, "class" for intangibles
    asset_class: z.string().optional(),
    description: z.string(),
    amount: z.string().optional(),         // for intangibles (string in CSV)
    capex_amount: z.string().optional(),   // for capex
    currency: z.string(),
    present_ccy: z.string(),
    in_service: z.string(),                // YYYY-MM-DD
    life_m: z.string().optional(),
    method: z.string().optional(),         // SL|DDB (capex only)
    cost_center: z.string().optional(),
    project: z.string().optional(),
});

export const CsvImportPayload = z.object({
    // Allows explicit header mapping if CSV headers differ from canonical names
    mapping: CsvColumnMap.optional(),
    // Default values to apply when a column is missing (or blank)
    defaults: z.object({
        currency: z.string().length(3),
        present_ccy: z.string().length(3),
        method: z.enum(["SL", "DDB"]).optional(),   // capex only
    }).optional(),
    // Precision used later for schedule generation (not required for import)
    precision: z.number().int().min(0).max(6).default(2).optional(),
});
export type CsvImportPayload = z.infer<typeof CsvImportPayload>;

export const BulkPostRequest = z.object({
    kind: z.enum(["depr", "amort"]),              // depreciation or amortization
    year: z.number().int().min(1900),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true),
    plan_ids: z.array(z.string()).optional(),    // limit to certain plans
    memo: z.string().optional(),
});
export type BulkPostRequest = z.infer<typeof BulkPostRequest>;

export const CsvImportResult = z.object({
    created: z.number().int().min(0),
    errors: z.array(z.object({
        line: z.number().int().min(1),
        error: z.string(),
    })),
});
export type CsvImportResult = z.infer<typeof CsvImportResult>;

export const BulkPostResult = z.object({
    dry_run: z.boolean(),
    kind: z.enum(["depr", "amort"]),
    year: z.number().int(),
    month: z.number().int(),
    plans: z.number().int().optional(),
    lines: z.number().int().optional(),
    total_amount: z.number().optional(),
    sample: z.array(z.object({
        plan_id: z.string(),
        amount: z.number(),
        present_ccy: z.string(),
    })).optional(),
    posted_journals: z.number().int().optional(),
});
export type BulkPostResult = z.infer<typeof BulkPostResult>;
