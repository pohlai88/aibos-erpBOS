import { z } from 'zod';

// --- Supplier Banking & Payment Methods (M23) --------------------------------
export const SupplierBankUpsert = z.object({
  supplier_id: z.string().min(1),
  method: z.enum(['ACH', 'SEPA', 'TT', 'MANUAL']),
  iban: z.string().optional(),
  bic: z.string().optional(),
  acct_no: z.string().optional(),
  acct_ccy: z.string().length(3),
  bank_name: z.string().optional(),
  country: z.string().optional(),
  active: z.boolean().default(true),
});

export const PaymentPrefUpsert = z.object({
  supplier_id: z.string().min(1),
  pay_terms: z.string().optional(),
  pay_day_rule: z.string().optional(),
  min_amount: z.number().optional(),
  hold_pay: z.boolean().default(false),
});

export const FileProfileUpsert = z.object({
  bank_code: z.string().min(1),
  format: z.enum(['PAIN_001', 'CSV']),
  profile: z.record(z.any()),
});

// --- Payment Run Lifecycle (M23) ---------------------------------------------
export const PayRunCreate = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  ccy: z.string().length(3),
  present_ccy: z.string().length(3).optional(),
  memo: z.string().optional(),
});

export const PayRunSelect = z.object({
  run_id: z.string().min(1),
  filters: z
    .object({
      suppliers: z.array(z.string()).optional(),
      due_on_or_before: z.string().optional(), // ISO date
      min_amount: z.number().optional(),
      hold_tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export const PayRunApprove = z.object({
  run_id: z.string().min(1),
});

export const PayRunExport = z.object({
  run_id: z.string().min(1),
  bank_code: z.string().min(1),
  format: z.enum(['PAIN_001', 'CSV']).optional(),
});

export const PayRunExecute = z.object({
  run_id: z.string().min(1),
});

// --- Bank File Import (M23) --------------------------------------------------
export const BankFileImport = z.object({
  kind: z.enum(['CAMT053', 'CSV']),
  filename: z.string().min(1),
  payload: z.string().min(1),
});

// --- Response Types (M23) ---------------------------------------------------
export const SupplierBankResponse = z.object({
  supplier_id: z.string(),
  method: z.string(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  acct_no: z.string().optional(),
  acct_ccy: z.string(),
  bank_name: z.string().optional(),
  country: z.string().optional(),
  active: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const PaymentPrefResponse = z.object({
  supplier_id: z.string(),
  pay_terms: z.string().optional(),
  pay_day_rule: z.string().optional(),
  min_amount: z.number().optional(),
  hold_pay: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const PayRunResponse = z.object({
  id: z.string(),
  year: z.number(),
  month: z.number(),
  status: z.string(),
  ccy: z.string(),
  present_ccy: z.string().optional(),
  created_by: z.string(),
  created_at: z.string(),
  approved_by: z.string().optional(),
  approved_at: z.string().optional(),
  lines: z
    .array(
      z.object({
        id: z.string(),
        supplier_id: z.string(),
        invoice_id: z.string(),
        due_date: z.string(),
        gross_amount: z.number(),
        disc_amount: z.number(),
        pay_amount: z.number(),
        inv_ccy: z.string(),
        pay_ccy: z.string(),
        fx_rate: z.number().optional(),
        bank_ref: z.string().optional(),
        status: z.string(),
        note: z.string().optional(),
      })
    )
    .optional(),
  summary: z
    .object({
      total_lines: z.number(),
      total_amount: z.number(),
      suppliers_count: z.number(),
    })
    .optional(),
});

export const PayExportResponse = z.object({
  id: z.string(),
  run_id: z.string(),
  format: z.string(),
  filename: z.string(),
  checksum: z.string(),
  created_at: z.string(),
  payload: z.string().optional(), // Only include in response if requested
});

export const BankFileImportResponse = z.object({
  id: z.string(),
  kind: z.string(),
  filename: z.string(),
  imported_at: z.string(),
  summary: z.object({
    transactions_imported: z.number(),
    transactions_matched: z.number(),
    transactions_unmatched: z.number(),
    runs_updated: z.number(),
  }),
});

export const BankTxnMapResponse = z.object({
  id: z.string(),
  bank_date: z.string(),
  amount: z.number(),
  ccy: z.string(),
  counterparty: z.string().optional(),
  memo: z.string().optional(),
  matched_run_id: z.string().optional(),
  matched_line_id: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
});

export const FileProfileResponse = z.object({
  bank_code: z.string(),
  format: z.string(),
  profile: z.record(z.any()),
  updated_at: z.string(),
  updated_by: z.string(),
});

// --- Type Exports (M23) ------------------------------------------------------
export type SupplierBankUpsertType = z.infer<typeof SupplierBankUpsert>;
export type PaymentPrefUpsertType = z.infer<typeof PaymentPrefUpsert>;
export type FileProfileUpsertType = z.infer<typeof FileProfileUpsert>;
export type PayRunCreateType = z.infer<typeof PayRunCreate>;
export type PayRunSelectType = z.infer<typeof PayRunSelect>;
export type PayRunApproveType = z.infer<typeof PayRunApprove>;
export type PayRunExportType = z.infer<typeof PayRunExport>;
export type PayRunExecuteType = z.infer<typeof PayRunExecute>;
export type BankFileImportType = z.infer<typeof BankFileImport>;

export type SupplierBankResponseType = z.infer<typeof SupplierBankResponse>;
export type PaymentPrefResponseType = z.infer<typeof PaymentPrefResponse>;
export type PayRunResponseType = z.infer<typeof PayRunResponse>;
export type PayExportResponseType = z.infer<typeof PayExportResponse>;
export type BankFileImportResponseType = z.infer<typeof BankFileImportResponse>;
export type BankTxnMapResponseType = z.infer<typeof BankTxnMapResponse>;
export type FileProfileResponseType = z.infer<typeof FileProfileResponse>;
