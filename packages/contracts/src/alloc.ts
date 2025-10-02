import { z } from "zod";

export const AllocRuleUpsert = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean().default(true),
  method: z.enum(["PERCENT","RATE_PER_UNIT","DRIVER_SHARE"]),
  driver_code: z.string().optional(),
  rate_per_unit: z.number().positive().optional(),
  src_account: z.string().optional(),
  src_cc_like: z.string().optional(),
  src_project: z.string().optional(),
  eff_from: z.string().optional(),
  eff_to: z.string().optional(),
  order_no: z.number().int().min(1).default(1),
  targets: z.array(z.object({ 
    target_cc: z.string(), 
    percent: z.number().min(0).max(1) 
  })).optional()
}).refine((v) => {
  if (v.method === "PERCENT") return !!(v.targets && v.targets.length);
  if (v.method === "RATE_PER_UNIT") return !!(v.driver_code && v.rate_per_unit);
  if (v.method === "DRIVER_SHARE") return !!v.driver_code;
  return false;
}, "Invalid configuration for chosen method");

export const AllocDriverUpsert = z.object({
  driver_code: z.string(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  rows: z.array(z.object({
    cost_center: z.string().optional(),
    project: z.string().optional(),
    value: z.number().nonnegative()
  })).min(1)
});

export const AllocRunRequest = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
  rules: z.array(z.string()).optional(),    // codes to limit
  memo: z.string().optional()
});

export const AllocCsvImport = z.object({
  kind: z.enum(["RULES","DRIVERS"]),
  mapping: z.record(z.string()).optional()
});

// Response types
export const AllocRuleResponse = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  method: z.string(),
  driver_code: z.string().optional(),
  rate_per_unit: z.number().optional(),
  src_account: z.string().optional(),
  src_cc_like: z.string().optional(),
  src_project: z.string().optional(),
  eff_from: z.string().optional(),
  eff_to: z.string().optional(),
  order_no: z.number(),
  targets: z.array(z.object({
    target_cc: z.string(),
    percent: z.number()
  })).optional(),
  updated_at: z.string(),
  updated_by: z.string()
});

export const AllocDriverResponse = z.object({
  driver_code: z.string(),
  year: z.number(),
  month: z.number(),
  rows: z.array(z.object({
    cost_center: z.string().optional(),
    project: z.string().optional(),
    value: z.number()
  }))
});

export const AllocRunResponse = z.object({
  run_id: z.string(),
  company_id: z.string(),
  year: z.number(),
  month: z.number(),
  mode: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  lines: z.array(z.object({
    id: z.string(),
    rule_id: z.string(),
    src_account: z.string().optional(),
    src_cc: z.string().optional(),
    target_cc: z.string(),
    amount_base: z.number(),
    driver_code: z.string().optional(),
    driver_value: z.number().optional(),
    method: z.string(),
    note: z.string().optional()
  })).optional(),
  summary: z.object({
    total_rules_processed: z.number(),
    total_amount_allocated: z.number(),
    journals_posted: z.number().optional()
  }).optional()
});

// Type exports
export type AllocRuleUpsertType = z.infer<typeof AllocRuleUpsert>;
export type AllocDriverUpsertType = z.infer<typeof AllocDriverUpsert>;
export type AllocRunRequestType = z.infer<typeof AllocRunRequest>;
export type AllocCsvImportType = z.infer<typeof AllocCsvImport>;
export type AllocRuleResponseType = z.infer<typeof AllocRuleResponse>;
export type AllocDriverResponseType = z.infer<typeof AllocDriverResponse>;
export type AllocRunResponseType = z.infer<typeof AllocRunResponse>;
