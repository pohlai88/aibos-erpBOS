import { z } from 'zod';

// --- Cash Flow Mapping & Scenarios (M22) -------------------------------------
export const CfMapUpsert = z.object({
  map_code: z.string().min(1),
  account_like: z.string().min(1),
  cf_section: z.enum(['OPERATING', 'INVESTING', 'FINANCING', 'NONCASH']),
  sign: z.enum(['+', '-']),
  note: z.string().optional(),
});

export const CfScenarioUpsert = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['BASE', 'BUDGET', 'FORECAST', 'MANUAL']),
  active: z.boolean().default(true),
});

// --- Cash Flow Run Requests (M22) --------------------------------------------
export const CfRunIndirectReq = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  map_code: z.string().default('IFRS-INDIRECT'),
  present: z.string().length(3).optional(),
  scenario: z.string().optional(),
  dry_run: z.boolean().default(true),
});

export const CfRunDirectReq = z.object({
  start_date: z.string(), // ISO date of week-1 (window start)
  weeks: z.number().int().min(1).max(26).default(13),
  present: z.string().length(3).optional(),
  scenario: z.string().optional(),
  dry_run: z.boolean().default(true),
});

// --- Driver & Bank Data Import (M22) ----------------------------------------
export const CfDriverImport = z.object({
  year: z.number().int(),
  iso_week: z.number().int().min(1).max(53),
  driver_code: z.string().min(1),
  mapping: z.record(z.string()), // CSV column map
});

export const BankTxnCsvImport = z.object({
  acct_code: z.string().min(1),
  mapping: z.record(z.string()),
});

export const CfDriverWeekUpsert = z.object({
  year: z.number().int(),
  iso_week: z.number().int().min(1).max(53),
  driver_code: z.string().min(1),
  cost_center: z.string().optional(),
  project: z.string().optional(),
  amount: z.number(),
  scenario: z.string().min(1),
});

export const CfAdjustWeekUpsert = z.object({
  year: z.number().int(),
  iso_week: z.number().int().min(1).max(53),
  bucket: z.enum(['RECEIPTS', 'PAYMENTS']),
  memo: z.string().optional(),
  amount: z.number(),
  scenario: z.string().min(1),
});

export const BankAccountUpsert = z.object({
  acct_code: z.string().min(1),
  name: z.string().min(1),
  ccy: z.string().length(3),
});

// --- Response Types (M22) ---------------------------------------------------
export const CfMapResponse = z.object({
  map_code: z.string(),
  account_like: z.string(),
  cf_section: z.string(),
  sign: z.string(),
  note: z.string().optional(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const CfScenarioResponse = z.object({
  code: z.string(),
  name: z.string(),
  kind: z.string(),
  active: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const CfRunResponse = z.object({
  id: z.string(),
  scope: z.string(),
  year: z.number(),
  month: z.number().optional(),
  start_date: z.string().optional(),
  mode: z.string(),
  present_ccy: z.string().optional(),
  scenario: z.string().optional(),
  created_at: z.string(),
  created_by: z.string(),
  lines: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        period: z.string(),
        amount: z.number(),
        note: z.string().optional(),
      })
    )
    .optional(),
});

export const CfDriverWeekResponse = z.object({
  year: z.number(),
  iso_week: z.number(),
  driver_code: z.string(),
  cost_center: z.string().optional(),
  project: z.string().optional(),
  amount: z.number(),
  scenario: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const CfAdjustWeekResponse = z.object({
  id: z.string(),
  year: z.number(),
  iso_week: z.number(),
  bucket: z.string(),
  memo: z.string().optional(),
  amount: z.number(),
  scenario: z.string(),
  created_at: z.string(),
  created_by: z.string(),
});

export const BankAccountResponse = z.object({
  acct_code: z.string(),
  name: z.string(),
  ccy: z.string(),
});

export const BankBalanceResponse = z.object({
  acct_code: z.string(),
  as_of_date: z.string(),
  balance: z.number(),
});

export const BankTxnImportResponse = z.object({
  id: z.string(),
  acct_code: z.string(),
  txn_date: z.string(),
  amount: z.number(),
  memo: z.string().optional(),
  source: z.string().optional(),
  imported_at: z.string(),
});

// --- Type Exports (M22) ------------------------------------------------------
export type CfMapUpsertType = z.infer<typeof CfMapUpsert>;
export type CfScenarioUpsertType = z.infer<typeof CfScenarioUpsert>;
export type CfRunIndirectReqType = z.infer<typeof CfRunIndirectReq>;
export type CfRunDirectReqType = z.infer<typeof CfRunDirectReq>;
export type CfDriverImportType = z.infer<typeof CfDriverImport>;
export type BankTxnCsvImportType = z.infer<typeof BankTxnCsvImport>;
export type CfDriverWeekUpsertType = z.infer<typeof CfDriverWeekUpsert>;
export type CfAdjustWeekUpsertType = z.infer<typeof CfAdjustWeekUpsert>;
export type BankAccountUpsertType = z.infer<typeof BankAccountUpsert>;

export type CfMapResponseType = z.infer<typeof CfMapResponse>;
export type CfScenarioResponseType = z.infer<typeof CfScenarioResponse>;
export type CfRunResponseType = z.infer<typeof CfRunResponse>;
export type CfDriverWeekResponseType = z.infer<typeof CfDriverWeekResponse>;
export type CfAdjustWeekResponseType = z.infer<typeof CfAdjustWeekResponse>;
export type BankAccountResponseType = z.infer<typeof BankAccountResponse>;
export type BankBalanceResponseType = z.infer<typeof BankBalanceResponse>;
export type BankTxnImportResponseType = z.infer<typeof BankTxnImportResponse>;
