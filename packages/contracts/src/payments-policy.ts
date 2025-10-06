import { z } from 'zod';

// --- M23.1 Dual-Control & KYC Contracts -------------------------------------

// --- Approval Policies (M23.1) -----------------------------------------------
export const ApprovalPolicyUpsert = z.object({
  policy_code: z.string().min(1),
  min_amount: z.number().min(0),
  max_amount: z.number().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  require_reviewer: z.boolean().default(true),
  require_approver: z.boolean().default(true),
  require_dual_approver: z.boolean().default(false),
});

export const SupplierPolicyAssign = z.object({
  supplier_id: z.string().min(1),
  policy_code: z.string().min(1),
});

export const SupplierLimitUpsert = z.object({
  supplier_id: z.string().min(1),
  day_cap: z.number().nullable().optional(),
  run_cap: z.number().nullable().optional(),
  year_cap: z.number().nullable().optional(),
});

// --- KYC Dossier (M23.1) -----------------------------------------------------
export const PayeeKycUpsert = z.object({
  supplier_id: z.string().min(1),
  residency: z.string().optional(),
  tax_form: z.enum(['W9', 'W8BEN', 'W8BENE', 'LOCAL']).optional(),
  tax_id: z.string().optional(),
  doc_type: z.string().optional(),
  doc_ref: z.string().optional(),
  doc_expires: z.string().optional(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  on_hold: z.boolean().optional(),
  notes: z.string().optional(),
});

// --- Sanctions Screening (M23.1) ---------------------------------------------
export const DenylistUpsert = z.object({
  name: z.string().min(1),
  country: z.string().optional(),
  source: z.string().default('LOCAL'),
});

export const SanctionScreenRequest = z.object({
  run_id: z.string().optional(),
  supplier_id: z.string().optional(),
});

export const SanctionDecision = z.object({
  hit_id: z.string().min(1),
  decision: z.enum(['cleared', 'blocked']),
  reason: z.string().optional(),
});

// --- Approval Steps (M23.1) --------------------------------------------------
export const RunReview = z.object({
  run_id: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const RunApprove = z.object({
  run_id: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const RunApprove2 = z.object({
  run_id: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

// --- Response Types (M23.1) --------------------------------------------------
export const ApprovalPolicyResponse = z.object({
  policy_code: z.string(),
  min_amount: z.number(),
  max_amount: z.number().nullable(),
  currency: z.string().nullable(),
  require_reviewer: z.boolean(),
  require_approver: z.boolean(),
  require_dual_approver: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const SupplierPolicyResponse = z.object({
  supplier_id: z.string(),
  policy_code: z.string(),
});

export const SupplierLimitResponse = z.object({
  supplier_id: z.string(),
  day_cap: z.number().nullable(),
  run_cap: z.number().nullable(),
  year_cap: z.number().nullable(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const PayeeKycResponse = z.object({
  supplier_id: z.string(),
  residency: z.string().nullable(),
  tax_form: z.string().nullable(),
  tax_id: z.string().nullable(),
  doc_type: z.string().nullable(),
  doc_ref: z.string().nullable(),
  doc_expires: z.string().nullable(),
  risk_level: z.string().nullable(),
  on_hold: z.boolean(),
  notes: z.string().nullable(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const DenylistResponse = z.object({
  name_norm: z.string(),
  country: z.string().nullable(),
  source: z.string(),
  listed_at: z.string(),
});

export const SanctionHitResponse = z.object({
  id: z.string(),
  supplier_id: z.string(),
  name_norm: z.string(),
  match_score: z.number(),
  source: z.string(),
  status: z.string(),
  decided_by: z.string().nullable(),
  decided_at: z.string().nullable(),
  reason: z.string().nullable(),
});

export const SanctionScreenResponse = z.object({
  id: z.string(),
  run_id: z.string().nullable(),
  supplier_id: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string(),
  hits: z.array(SanctionHitResponse),
});

export const RunApprovalResponse = z.object({
  id: z.string(),
  run_id: z.string(),
  step: z.string(),
  actor: z.string(),
  decided_at: z.string(),
  decision: z.string(),
  reason: z.string().nullable(),
});

export const RunGateResponse = z.object({
  run_id: z.string(),
  gates: z.array(z.string()),
  status: z.string(),
  next_step: z.string().nullable(),
});

// --- Type Exports (M23.1) -----------------------------------------------------
export type ApprovalPolicyUpsertType = z.infer<typeof ApprovalPolicyUpsert>;
export type SupplierPolicyAssignType = z.infer<typeof SupplierPolicyAssign>;
export type SupplierLimitUpsertType = z.infer<typeof SupplierLimitUpsert>;
export type PayeeKycUpsertType = z.infer<typeof PayeeKycUpsert>;
export type DenylistUpsertType = z.infer<typeof DenylistUpsert>;
export type SanctionScreenRequestType = z.infer<typeof SanctionScreenRequest>;
export type SanctionDecisionType = z.infer<typeof SanctionDecision>;
export type RunReviewType = z.infer<typeof RunReview>;
export type RunApproveType = z.infer<typeof RunApprove>;
export type RunApprove2Type = z.infer<typeof RunApprove2>;

export type ApprovalPolicyResponseType = z.infer<typeof ApprovalPolicyResponse>;
export type SupplierPolicyResponseType = z.infer<typeof SupplierPolicyResponse>;
export type SupplierLimitResponseType = z.infer<typeof SupplierLimitResponse>;
export type PayeeKycResponseType = z.infer<typeof PayeeKycResponse>;
export type DenylistResponseType = z.infer<typeof DenylistResponse>;
export type SanctionHitResponseType = z.infer<typeof SanctionHitResponse>;
export type SanctionScreenResponseType = z.infer<typeof SanctionScreenResponse>;
export type RunApprovalResponseType = z.infer<typeof RunApprovalResponse>;
export type RunGateResponseType = z.infer<typeof RunGateResponse>;
