// M16: Capex & Depreciation Contracts
// Zod schemas for capex plan management, schedule generation, and posting

import { z } from "zod";

export const CapexPlanUpsert = z.object({
    asset_class: z.string().min(1),
    description: z.string().min(1),
    capex_amount: z.number().positive(),
    currency: z.string().length(3),
    present_ccy: z.string().length(3),
    in_service: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    life_m: z.number().int().min(1).optional(),
    method: z.enum(["SL", "DDB"]).optional(),
    cost_center: z.string().optional(),
    project: z.string().optional(),
});
export type CapexPlanUpsert = z.infer<typeof CapexPlanUpsert>;

export const DeprGenerateRequest = z.object({
    plan_id: z.string().optional(),        // if omitted, (re)generate for all ungenerated plans
    precision: z.number().int().min(0).max(6).default(2),
});
export type DeprGenerateRequest = z.infer<typeof DeprGenerateRequest>;

export const DeprPostRequest = z.object({
    year: z.number().int().min(1900),
    month: z.number().int().min(1).max(12),
    plan_id: z.string().optional(),        // post a single plan or the whole month
    memo: z.string().optional(),
    dry_run: z.boolean().default(false),
});
export type DeprPostRequest = z.infer<typeof DeprPostRequest>;

export const AssetClassRef = z.object({
    code: z.string(),
    label: z.string(),
    method: z.enum(["SL", "DDB"]),
    default_life_m: z.number().int().positive(),
    residual_pct: z.number().min(0).max(100),
});
export type AssetClassRef = z.infer<typeof AssetClassRef>;

export const AssetPostingMap = z.object({
    company_id: z.string(),
    asset_class: z.string(),
    depr_expense_account: z.string(),
    accum_depr_account: z.string(),
});
export type AssetPostingMap = z.infer<typeof AssetPostingMap>;
