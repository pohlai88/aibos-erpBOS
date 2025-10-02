import { z } from "zod";

export const TaxPartnerUpsert = z.object({
    code: z.string(),
    name: z.string(),
    frequency: z.enum(["M", "Q", "Y"]),
    base_ccy: z.string().length(3),
});

export type TaxPartnerUpsertType = z.infer<typeof TaxPartnerUpsert>;

export const TaxTemplateUpsert = z.object({
    partner_code: z.string(),
    version: z.string(),
    boxes: z.array(z.object({
        box_id: z.string(),
        box_label: z.string(),
        sign: z.enum(["+", "-"]),
        ordinal: z.number().int().min(1),
    })).min(1)
});

export type TaxTemplateUpsertType = z.infer<typeof TaxTemplateUpsert>;

export const TaxBoxMapUpsert = z.object({
    partner_code: z.string(),
    version: z.string(),
    rules: z.array(z.object({
        box_id: z.string(),
        tax_code: z.string().optional(),
        direction: z.enum(["OUTPUT", "INPUT"]).optional(),
        rate_name: z.string().optional(),
        account_like: z.string().optional(),
        cc_like: z.string().optional(),
        project_like: z.string().optional(),
        priority: z.number().int().min(1).default(1),
    })).min(1)
});

export type TaxBoxMapUpsertType = z.infer<typeof TaxBoxMapUpsert>;

export const TaxReturnRunRequest = z.object({
    partner_code: z.string(),
    version: z.string(),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true),
    include_detail: z.boolean().default(false),
    memo: z.string().optional()
});

export type TaxReturnRunRequestType = z.infer<typeof TaxReturnRunRequest>;

export const TaxAdjustmentUpsert = z.object({
    partner_code: z.string(),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    box_id: z.string(),
    amount: z.number(), // +/- allowed
    memo: z.string().optional()
});

export type TaxAdjustmentUpsertType = z.infer<typeof TaxAdjustmentUpsert>;

export const TaxExportRequest = z.object({
    run_id: z.string(),
    format: z.enum(["CSV", "XML", "JSON"]).default("CSV"),
    profile: z.string().optional() // e.g., 'MY-SST-02-CSV', 'UK-VAT100-XML'
});

export type TaxExportRequestType = z.infer<typeof TaxExportRequest>;

export const TaxExportProfileUpsert = z.object({
    partner_code: z.string(),
    version: z.string(),
    format: z.string(),
    is_default: z.boolean().default(false)
});

export type TaxExportProfileUpsertType = z.infer<typeof TaxExportProfileUpsert>;

export const TaxCarryForwardScanRequest = z.object({
    partner_code: z.string(),
    from_year: z.number().int(),
    from_month: z.number().int().min(1).max(12),
    into_year: z.number().int(),
    into_month: z.number().int().min(1).max(12)
});

export type TaxCarryForwardScanRequestType = z.infer<typeof TaxCarryForwardScanRequest>;

export const TaxCarryForwardProposeRequest = z.object({
    proposals: z.array(z.object({
        source_ref: z.string(),
        box_id: z.string(),
        amount: z.number(),
        reason: z.string().default("LATE_POSTING")
    })).min(1)
});

export type TaxCarryForwardProposeRequestType = z.infer<typeof TaxCarryForwardProposeRequest>;

export const TaxCarryForwardAcceptRequest = z.object({
    ids: z.array(z.string()).min(1)
});

export type TaxCarryForwardAcceptRequestType = z.infer<typeof TaxCarryForwardAcceptRequest>;
