// M16.3/M16.4: Assets Configuration Contracts
// Zod schemas for assets configuration and preferences

import { z } from "zod";

export const AssetsConfigUpsert = z.object({
    proration_enabled: z.boolean().default(false),
    proration_basis: z.enum(["days_in_month", "half_month"]).default("days_in_month"),
    fx_presentation_policy: z.enum(["post_month", "in_service"]).default("post_month"),
});

export const AssetsConfigResponse = z.object({
    company_id: z.string(),
    proration_enabled: z.boolean(),
    proration_basis: z.enum(["days_in_month", "half_month"]),
    fx_presentation_policy: z.enum(["post_month", "in_service"]),
    created_at: z.string(),
    updated_at: z.string(),
});

export const AssetsLimitsUpsert = z.object({
    import_max_rows: z.number().int().min(1).max(100000).default(10000),
    bulk_post_max_rows: z.number().int().min(1).max(50000).default(5000),
});

export const AssetsLimitsResponse = z.object({
    company_id: z.string(),
    import_max_rows: z.number().int(),
    bulk_post_max_rows: z.number().int(),
    updated_at: z.string(),
});

export type AssetsConfigUpsert = z.infer<typeof AssetsConfigUpsert>;
export type AssetsConfigResponse = z.infer<typeof AssetsConfigResponse>;
export type AssetsLimitsUpsert = z.infer<typeof AssetsLimitsUpsert>;
export type AssetsLimitsResponse = z.infer<typeof AssetsLimitsResponse>;
