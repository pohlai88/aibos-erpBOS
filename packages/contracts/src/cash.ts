// M15: Working Capital & Cash Flow Contracts
// packages/contracts/src/cash.ts

import { z } from 'zod';

export const WcProfileCreate = z.object({
  name: z.string().min(1),
  dso_days: z.number().min(0),
  dpo_days: z.number().min(0),
  dio_days: z.number().min(0),
  tax_rate_pct: z.number().min(0).max(100).default(24),
  interest_apr: z.number().min(0).max(100).default(6),
});
export type WcProfileCreate = z.infer<typeof WcProfileCreate>;

export const CashVersionCreate = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  year: z.number().int().min(1900),
  profile_name: z.string().optional(), // convenience resolver
});
export type CashVersionCreate = z.infer<typeof CashVersionCreate>;

export const CashGenerateRequest = z.object({
  from_scenario: z.string().min(1), // e.g., "forecast:FY26-FC1" or "FY26-WIP"
  profile_name: z.string().optional(),
  present_ccy: z.string().length(3).default('MYR'),
  precision: z.number().int().min(0).max(6).default(2),
});
export type CashGenerateRequest = z.infer<typeof CashGenerateRequest>;
