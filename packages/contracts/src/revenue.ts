import { z } from 'zod';

// --- Revenue Recognition Core Contracts (M25.1) ------------------------------------------------

// Policy Management
export const RevPolicyUpsert = z.object({
  rev_account: z.string(),
  unbilled_ar_account: z.string(),
  deferred_rev_account: z.string(),
  rounding: z.enum(['HALF_UP', 'BANKERS']).default('HALF_UP'),
});

export const RevProdPolicyUpsert = z.object({
  product_id: z.string(),
  method: z.enum([
    'POINT_IN_TIME',
    'RATABLE_DAILY',
    'RATABLE_MONTHLY',
    'USAGE',
  ]),
  rev_account: z.string().optional(),
});

// POB Management
export const POBCreate = z.object({
  contract_id: z.string(),
  subscription_id: z.string().optional(),
  invoice_line_id: z.string().optional(),
  product_id: z.string(),
  name: z.string(),
  method: z.enum([
    'POINT_IN_TIME',
    'RATABLE_DAILY',
    'RATABLE_MONTHLY',
    'USAGE',
  ]),
  start_date: z.string(), // YYYY-MM-DD
  end_date: z.string().optional(), // YYYY-MM-DD
  qty: z.number().positive().default(1),
  uom: z.string().optional(),
  ssp: z.number().optional(),
  allocated_amount: z.number(),
  currency: z.string().length(3),
});

export const POBQuery = z.object({
  contract_id: z.string().optional(),
  product_id: z.string().optional(),
  status: z.enum(['OPEN', 'FULFILLED', 'CANCELLED']).optional(),
  method: z
    .enum(['POINT_IN_TIME', 'RATABLE_DAILY', 'RATABLE_MONTHLY', 'USAGE'])
    .optional(),
  start_date_from: z.string().optional(),
  start_date_to: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Allocation from Invoice
export const AllocFromInvoiceReq = z.object({
  invoice_id: z.string(),
  strategy: z.enum(['RELATIVE_SSP', 'LINE_AS_IS']).default('RELATIVE_SSP'),
});

export const AllocFromInvoiceResp = z.object({
  invoice_id: z.string(),
  pobs_created: z.number(),
  total_allocated: z.number(),
  pobs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      method: z.string(),
      allocated_amount: z.number(),
      currency: z.string(),
    })
  ),
});

// Schedule Management
export const ScheduleBuildReq = z.object({
  pob_id: z.string(),
  method: z.enum([
    'POINT_IN_TIME',
    'RATABLE_DAILY',
    'RATABLE_MONTHLY',
    'USAGE',
  ]),
  start_date: z.string(), // YYYY-MM-DD
  end_date: z.string().optional(), // YYYY-MM-DD
});

export const ScheduleQuery = z.object({
  pob_id: z.string().optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  status: z.enum(['PLANNED', 'PARTIAL', 'DONE']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Recognition Runs
export const RecognizeRunReq = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
});

export const RecognizeRunResp = z.object({
  run_id: z.string(),
  year: z.number(),
  month: z.number(),
  status: z.string(),
  total_amount: z.number(),
  lines_created: z.number(),
  dry_run: z.boolean(),
  stats: z
    .object({
      pobs_processed: z.number(),
      unbilled_ar_amount: z.number(),
      deferred_rev_amount: z.number(),
      revenue_amount: z.number(),
    })
    .optional(),
});

export const RecognitionRunQuery = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  status: z.enum(['DRAFT', 'POSTED', 'ERROR']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Events Management
export const EventCreate = z.object({
  pob_id: z.string(),
  kind: z.enum([
    'ACTIVATE',
    'FULFILL',
    'PAUSE',
    'RESUME',
    'CANCEL',
    'REFUND',
    'USAGE_REPORT',
  ]),
  occurred_at: z.string(), // ISO timestamp
  payload: z.any().optional(),
});

export const EventQuery = z.object({
  pob_id: z.string().optional(),
  kind: z
    .enum([
      'ACTIVATE',
      'FULFILL',
      'PAUSE',
      'RESUME',
      'CANCEL',
      'REFUND',
      'USAGE_REPORT',
    ])
    .optional(),
  occurred_at_from: z.string().optional(),
  occurred_at_to: z.string().optional(),
  processed: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Usage Bridge
export const UsageBridgeCreate = z.object({
  pob_id: z.string(),
  rollup_id: z.string(),
  qty: z.number(),
  rated_amount: z.number(),
  period_year: z.number().int(),
  period_month: z.number().int().min(1).max(12),
});

// RPO Snapshots
export const RPOSnapshotCreate = z.object({
  as_of_date: z.string(), // YYYY-MM-DD
  currency: z.string().length(3),
});

export const RPOSnapshotQuery = z.object({
  as_of_date_from: z.string().optional(),
  as_of_date_to: z.string().optional(),
  currency: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Export/Artifacts
export const ExportReq = z.object({
  run_id: z.string(),
  kind: z.enum(['CSV', 'JSON']),
});

export const ExportResp = z.object({
  artifact_id: z.string(),
  filename: z.string(),
  sha256: z.string(),
  bytes: z.number(),
  storage_uri: z.string(),
  download_url: z.string().optional(),
});

// Response Types
export const POBResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  contract_id: z.string(),
  subscription_id: z.string().optional(),
  invoice_line_id: z.string().optional(),
  product_id: z.string(),
  name: z.string(),
  method: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  qty: z.number(),
  uom: z.string().optional(),
  ssp: z.number().optional(),
  allocated_amount: z.number(),
  currency: z.string(),
  status: z.string(),
  created_at: z.string(),
  created_by: z.string(),
});

export const ScheduleResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  pob_id: z.string(),
  year: z.number(),
  month: z.number(),
  planned: z.number(),
  recognized: z.number(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const RecognitionRunResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  period_year: z.number(),
  period_month: z.number(),
  status: z.string(),
  stats: z.any().optional(),
  created_at: z.string(),
  created_by: z.string(),
});

export const RecognitionLineResponse = z.object({
  id: z.string(),
  run_id: z.string(),
  company_id: z.string(),
  pob_id: z.string(),
  year: z.number(),
  month: z.number(),
  amount: z.number(),
  dr_account: z.string(),
  cr_account: z.string(),
  memo: z.string().optional(),
  created_at: z.string(),
});

export const EventResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  pob_id: z.string(),
  occurred_at: z.string(),
  kind: z.string(),
  payload: z.any().optional(),
  processed_at: z.string().optional(),
  created_at: z.string(),
  created_by: z.string(),
});

export const RPOSnapshotResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  as_of_date: z.string(),
  currency: z.string(),
  total_rpo: z.number(),
  due_within_12m: z.number(),
  due_after_12m: z.number(),
  created_at: z.string(),
  created_by: z.string(),
});

export const RevPolicyResponse = z.object({
  company_id: z.string(),
  rev_account: z.string(),
  unbilled_ar_account: z.string(),
  deferred_rev_account: z.string(),
  rounding: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const RevProdPolicyResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  product_id: z.string(),
  method: z.string(),
  rev_account: z.string().optional(),
  updated_at: z.string(),
  updated_by: z.string(),
});

// Type exports
export type RevPolicyUpsertType = z.infer<typeof RevPolicyUpsert>;
export type RevProdPolicyUpsertType = z.infer<typeof RevProdPolicyUpsert>;
export type POBCreateType = z.infer<typeof POBCreate>;
export type POBQueryType = z.infer<typeof POBQuery>;
export type AllocFromInvoiceReqType = z.infer<typeof AllocFromInvoiceReq>;
export type AllocFromInvoiceRespType = z.infer<typeof AllocFromInvoiceResp>;
export type ScheduleBuildReqType = z.infer<typeof ScheduleBuildReq>;
export type ScheduleQueryType = z.infer<typeof ScheduleQuery>;
export type RecognizeRunReqType = z.infer<typeof RecognizeRunReq>;
export type RecognizeRunRespType = z.infer<typeof RecognizeRunResp>;
export type RecognitionRunQueryType = z.infer<typeof RecognitionRunQuery>;
export type EventCreateType = z.infer<typeof EventCreate>;
export type EventQueryType = z.infer<typeof EventQuery>;
export type UsageBridgeCreateType = z.infer<typeof UsageBridgeCreate>;
export type RPOSnapshotCreateType = z.infer<typeof RPOSnapshotCreate>;
export type RPOSnapshotQueryType = z.infer<typeof RPOSnapshotQuery>;
export type ExportReqType = z.infer<typeof ExportReq>;
export type ExportRespType = z.infer<typeof ExportResp>;

export type POBResponseType = z.infer<typeof POBResponse>;
export type ScheduleResponseType = z.infer<typeof ScheduleResponse>;
export type RecognitionRunResponseType = z.infer<typeof RecognitionRunResponse>;
export type RecognitionLineResponseType = z.infer<
  typeof RecognitionLineResponse
>;
export type EventResponseType = z.infer<typeof EventResponse>;
export type RPOSnapshotResponseType = z.infer<typeof RPOSnapshotResponse>;
export type RevPolicyResponseType = z.infer<typeof RevPolicyResponse>;
export type RevProdPolicyResponseType = z.infer<typeof RevProdPolicyResponse>;
