import { z } from 'zod';

// --- AR Credit Management & Collections Workbench (M24.1) -------------------------

export const CreditPolicyUpsert = z.object({
  policy_code: z.string(),
  segment: z.string().optional(),
  max_limit: z.number().nonnegative(),
  dso_target: z.number().int().positive().default(45),
  grace_days: z.number().int().min(0).default(5),
  ptp_tolerance: z.number().int().min(0).default(2),
  risk_weight: z.number().positive().default(1.0),
});

export const CustomerCreditUpsert = z.object({
  customer_id: z.string(),
  policy_code: z.string(),
  credit_limit: z.number().nonnegative(),
  risk_score: z.number().min(0).max(1).optional(),
  on_hold: z.boolean().optional(),
  hold_reason: z.string().optional(),
});

export const WorkbenchQuery = z.object({
  bucket: z.enum(['CURRENT', '1-30', '31-60', '61-90', '90+']).optional(),
  on_hold: z.boolean().optional(),
  min_exposure: z.number().optional(),
  max_rows: z.number().int().min(1).max(500).default(100),
});

export const CollectionsNoteCreate = z.object({
  customer_id: z.string(),
  invoice_id: z.string().optional(),
  kind: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE']),
  body: z.string(),
  next_action_date: z.string().optional(),
});

export const CreditEvaluateReq = z.object({
  dry_run: z.boolean().default(true),
  customer_ids: z.array(z.string()).optional(), // evaluate specific customers only
});

export const CreditEvaluateResult = z.object({
  customers_evaluated: z.number(),
  holds_triggered: z.number(),
  releases_triggered: z.number(),
  errors: z.number(),
  details: z.array(
    z.object({
      customer_id: z.string(),
      action: z.enum(['HOLD', 'RELEASE', 'NO_CHANGE']),
      reason: z.string(),
      exposure: z.number(),
      dso: z.number(),
      risk_score: z.number().optional(),
    })
  ),
});

export const WorkbenchCustomer = z.object({
  customer_id: z.string(),
  customer_name: z.string(),
  exposure: z.number(),
  dso: z.number(),
  bucket: z.string(),
  on_hold: z.boolean(),
  hold_reason: z.string().optional(),
  disputes_open: z.number(),
  ptp_open: z.number(),
  last_contact: z.string().optional(),
  next_action_date: z.string().optional(),
  priority_score: z.number(),
});

export const CollectionsKpiSnapshot = z.object({
  as_of_date: z.string(),
  total_exposure: z.number(),
  total_dso: z.number(),
  customers_on_hold: z.number(),
  total_disputes: z.number(),
  total_ptp: z.number(),
  customers: z.array(
    z.object({
      customer_id: z.string(),
      customer_name: z.string(),
      exposure: z.number(),
      dso: z.number(),
      disputes_open: z.number(),
      ptp_open: z.number(),
      on_hold: z.boolean(),
    })
  ),
});

// Type exports
export type CreditPolicyUpsertType = z.infer<typeof CreditPolicyUpsert>;
export type CustomerCreditUpsertType = z.infer<typeof CustomerCreditUpsert>;
export type WorkbenchQueryType = z.infer<typeof WorkbenchQuery>;
export type CollectionsNoteCreateType = z.infer<typeof CollectionsNoteCreate>;
export type CreditEvaluateReqType = z.infer<typeof CreditEvaluateReq>;
export type CreditEvaluateResultType = z.infer<typeof CreditEvaluateResult>;
export type WorkbenchCustomerType = z.infer<typeof WorkbenchCustomer>;
export type CollectionsKpiSnapshotType = z.infer<typeof CollectionsKpiSnapshot>;
