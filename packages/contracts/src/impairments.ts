// M16.3: Asset Impairments Contracts
// Zod schemas for asset impairment operations

import { z } from "zod";

export const ImpairmentCreate = z.object({
  plan_kind: z.enum(["capex", "intangible"]),
  plan_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  memo: z.string().optional(),
});

export const ImpairmentResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  plan_kind: z.enum(["capex", "intangible"]),
  plan_id: z.string(),
  date: z.string(),
  amount: z.number(),
  memo: z.string().optional(),
  created_at: z.string(),
  created_by: z.string(),
});

export const ImpairmentListResponse = z.object({
  impairments: z.array(ImpairmentResponse),
  total: z.number().int(),
});

export const UnpostRequest = z.object({
  kind: z.enum(["depr", "amort"]),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  plan_ids: z.array(z.string()).optional(),
  dry_run: z.boolean().default(true),
});

export const UnpostResponse = z.object({
  dry_run: z.boolean(),
  kind: z.enum(["depr", "amort"]),
  year: z.number().int(),
  month: z.number().int(),
  plans: z.number().int(),
  lines: z.number().int(),
  total_amount: z.number(),
  journals_to_reverse: z.array(z.string()),
  sample: z.array(z.object({
    plan_id: z.string(),
    amount: z.number(),
    journal_id: z.string(),
  })),
});

export type ImpairmentCreate = z.infer<typeof ImpairmentCreate>;
export type ImpairmentResponse = z.infer<typeof ImpairmentResponse>;
export type ImpairmentListResponse = z.infer<typeof ImpairmentListResponse>;
export type UnpostRequest = z.infer<typeof UnpostRequest>;
export type UnpostResponse = z.infer<typeof UnpostResponse>;
