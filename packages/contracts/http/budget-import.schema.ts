// M14.3: Budget Import Contracts
import { z } from 'zod';

export const BudgetImportMapping = z.object({
  account_code: z.string().min(1, 'Account code column is required'),
  month: z.string().min(1, 'Month column is required'),
  amount: z.string().min(1, 'Amount column is required'),
  cost_center: z.string().optional(),
  project: z.string().optional(),
});

export const BudgetImportDefaults = z.object({
  currency: z.string().length(3, 'Currency must be 3 characters'),
  year: z.number().int().min(1900).max(2100),
});

export const BudgetImportRequest = z.object({
  mapping: BudgetImportMapping,
  defaults: BudgetImportDefaults,
  precision: z.number().int().min(0).max(6).default(2),
});

export const BudgetImportError = z.object({
  row: z.number().int().min(1),
  issues: z.array(z.string()),
});

export const BudgetImportSummary = z.object({
  importId: z.string(),
  source_name: z.string(),
  rows_total: z.number().int().min(0),
  rows_valid: z.number().int().min(0),
  rows_invalid: z.number().int().min(0),
  status: z.enum(['pending', 'dry_run_ok', 'committed', 'failed']),
  errors: z.array(BudgetImportError).optional(),
});

export const BudgetImportResponse = z.object({
  summary: BudgetImportSummary,
  errors: z.array(BudgetImportError).optional(),
});

export type BudgetImportRequest = z.infer<typeof BudgetImportRequest>;
export type BudgetImportMapping = z.infer<typeof BudgetImportMapping>;
export type BudgetImportDefaults = z.infer<typeof BudgetImportDefaults>;
export type BudgetImportError = z.infer<typeof BudgetImportError>;
export type BudgetImportSummary = z.infer<typeof BudgetImportSummary>;
export type BudgetImportResponse = z.infer<typeof BudgetImportResponse>;
