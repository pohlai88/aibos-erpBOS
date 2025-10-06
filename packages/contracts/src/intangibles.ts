// M16.1: Intangibles & Amortization Contracts
// Zod schemas for intangible plan management, amortization generation, and posting

import { z } from 'zod';

export const IntangiblePlanUpsert = z.object({
  class: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  present_ccy: z.string().length(3),
  in_service: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  life_m: z.number().int().min(1),
  cost_center: z.string().optional(),
  project: z.string().optional(),
});
export type IntangiblePlanUpsert = z.infer<typeof IntangiblePlanUpsert>;

export const AmortGenerateRequest = z.object({
  plan_id: z.string().optional(), // if omitted, (re)generate for all ungenerated plans
  precision: z.number().int().min(0).max(6).default(2),
});
export type AmortGenerateRequest = z.infer<typeof AmortGenerateRequest>;

export const AmortPostRequest = z.object({
  year: z.number().int().min(1900),
  month: z.number().int().min(1).max(12),
  plan_id: z.string().optional(), // post a single plan or the whole month
  memo: z.string().optional(),
  dry_run: z.boolean().default(false),
});
export type AmortPostRequest = z.infer<typeof AmortPostRequest>;

export const IntangiblePostingMap = z.object({
  company_id: z.string(),
  class: z.string(),
  amort_expense_account: z.string(),
  accum_amort_account: z.string(),
});
export type IntangiblePostingMap = z.infer<typeof IntangiblePostingMap>;
