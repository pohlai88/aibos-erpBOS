import { z } from 'zod';

// --- M26.1: Auto-Controls & Certifications Contracts ---

// Control Management
export const ControlUpsert = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string().min(1),
  domain: z.enum([
    'CLOSE',
    'AP',
    'AR',
    'REV',
    'FX',
    'BANK',
    'INV',
    'FIXEDASSET',
  ]),
  frequency: z.enum(['PER_RUN', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  auto_kind: z.enum(['NONE', 'SQL', 'SCRIPT', 'POLICY']),
  auto_config: z.record(z.any()).optional(),
  evidence_required: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const ControlQuery = z.object({
  domain: z
    .enum(['CLOSE', 'AP', 'AR', 'REV', 'FX', 'BANK', 'INV', 'FIXEDASSET'])
    .optional(),
  frequency: z
    .enum(['PER_RUN', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC'])
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Control Assignment Management
export const AssignmentUpsert = z
  .object({
    control_id: z.string().min(1),
    run_id: z.string().optional(),
    task_id: z.string().optional(),
    entity_id: z.string().optional(),
    owner: z.string().min(1),
    approver: z.string().min(1),
    sla_due_at: z.string().optional(), // ISO 8601
    active: z.boolean().default(true),
  })
  .refine(data => data.run_id || data.task_id || data.entity_id, {
    message:
      'At least one assignment target (run_id, task_id, or entity_id) must be provided',
  });

export const AssignmentQuery = z.object({
  control_id: z.string().optional(),
  run_id: z.string().optional(),
  task_id: z.string().optional(),
  entity_id: z.string().optional(),
  owner: z.string().optional(),
  approver: z.string().optional(),
  active: z.boolean().optional(),
  sla_breach: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Control Run Management
export const ControlRunRequest = z
  .object({
    control_id: z.string().optional(),
    assignment_id: z.string().optional(),
    run_id: z.string().optional(),
    scheduled_at: z.string().optional(), // ISO 8601, defaults to now
  })
  .refine(data => data.control_id || data.assignment_id, {
    message: 'Either control_id or assignment_id must be provided',
  });

export const ControlRunQuery = z.object({
  control_id: z.string().optional(),
  assignment_id: z.string().optional(),
  run_id: z.string().optional(),
  status: z.enum(['QUEUED', 'RUNNING', 'PASS', 'FAIL', 'WAIVED']).optional(),
  scheduled_from: z.string().optional(), // ISO 8601
  scheduled_to: z.string().optional(), // ISO 8601
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Exception Management
export const ExceptionUpdate = z.object({
  id: z.string().min(1),
  remediation_state: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WAIVED']),
  assignee: z.string().optional(),
  due_at: z.string().optional(), // ISO 8601
  resolution_note: z.string().optional(),
});

export const ExceptionQuery = z.object({
  ctrl_run_id: z.string().optional(),
  remediation_state: z
    .enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WAIVED'])
    .optional(),
  material: z.boolean().optional(),
  assignee: z.string().optional(),
  sla_breach: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Control Waiver
export const ControlWaive = z.object({
  ctrl_run_id: z.string().min(1),
  reason: z.string().min(1),
  waived_by: z.string().min(1),
});

// Evidence Management
export const EvidenceAdd = z.object({
  ctrl_run_id: z.string().min(1),
  kind: z.enum(['LINK', 'FILE', 'NOTE', 'SNAPSHOT']),
  uri_or_note: z.string().min(1),
  checksum: z.string().optional(), // Required for FILE and SNAPSHOT types
});

export const EvidenceQuery = z.object({
  ctrl_run_id: z.string().optional(),
  kind: z.enum(['LINK', 'FILE', 'NOTE', 'SNAPSHOT']).optional(),
  added_by: z.string().optional(),
  added_from: z.string().optional(), // ISO 8601
  added_to: z.string().optional(), // ISO 8601
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Certification Management
export const CertTemplateUpsert = z.object({
  code: z.string().min(1),
  text: z.string().min(1),
  level: z.enum(['ENTITY', 'CONSOLIDATED']),
  active: z.boolean().default(true),
});

export const CertTemplateQuery = z.object({
  level: z.enum(['ENTITY', 'CONSOLIDATED']).optional(),
  active: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const CertSignReq = z.object({
  run_id: z.string().min(1),
  level: z.enum(['ENTITY', 'CONSOLIDATED']),
  statement_id: z.string().min(1),
  signer_role: z.enum(['MANAGER', 'CONTROLLER', 'CFO']),
  signer_name: z.string().min(1),
  snapshot_uri: z.string().optional(),
  checksum: z.string().min(1),
});

export const CertSignQuery = z.object({
  run_id: z.string().optional(),
  level: z.enum(['ENTITY', 'CONSOLIDATED']).optional(),
  signer_role: z.enum(['MANAGER', 'CONTROLLER', 'CFO']).optional(),
  signed_from: z.string().optional(), // ISO 8601
  signed_to: z.string().optional(), // ISO 8601
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Response Types
export const ControlResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  code: z.string(),
  name: z.string(),
  purpose: z.string(),
  domain: z.string(),
  frequency: z.string(),
  severity: z.string(),
  auto_kind: z.string(),
  auto_config: z.record(z.any()).optional(),
  evidence_required: z.boolean(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
});

export const AssignmentResponse = z.object({
  id: z.string(),
  control_id: z.string(),
  run_id: z.string().optional(),
  task_id: z.string().optional(),
  entity_id: z.string().optional(),
  owner: z.string(),
  approver: z.string(),
  sla_due_at: z.string().optional(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
});

export const ControlRunResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  control_id: z.string(),
  assignment_id: z.string().optional(),
  run_id: z.string().optional(),
  scheduled_at: z.string(),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
  created_at: z.string(),
  created_by: z.string(),
});

export const ExceptionResponse = z.object({
  id: z.string(),
  ctrl_run_id: z.string(),
  code: z.string(),
  message: z.string(),
  item_ref: z.string().optional(),
  material: z.boolean(),
  remediation_state: z.string(),
  assignee: z.string().optional(),
  due_at: z.string().optional(),
  resolved_at: z.string().optional(),
  resolution_note: z.string().optional(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const EvidenceResponse = z.object({
  id: z.string(),
  ctrl_run_id: z.string(),
  kind: z.string(),
  uri_or_note: z.string(),
  checksum: z.string().optional(),
  added_by: z.string(),
  added_at: z.string(),
});

export const CertTemplateResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  code: z.string(),
  text: z.string(),
  level: z.string(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
});

export const CertSignoffResponse = z.object({
  id: z.string(),
  company_id: z.string(),
  run_id: z.string(),
  level: z.string(),
  signer_role: z.string(),
  signer_name: z.string(),
  signed_at: z.string(),
  statement_id: z.string(),
  statement_text: z.string(),
  snapshot_uri: z.string().optional(),
  checksum: z.string(),
  created_at: z.string(),
  created_by: z.string(),
});

// Type exports for TypeScript
export type ControlUpsertType = z.infer<typeof ControlUpsert>;
export type ControlQueryType = z.infer<typeof ControlQuery>;
export type AssignmentUpsertType = z.infer<typeof AssignmentUpsert>;
export type AssignmentQueryType = z.infer<typeof AssignmentQuery>;
export type ControlRunRequestType = z.infer<typeof ControlRunRequest>;
export type ControlRunQueryType = z.infer<typeof ControlRunQuery>;
export type ExceptionUpdateType = z.infer<typeof ExceptionUpdate>;
export type ExceptionQueryType = z.infer<typeof ExceptionQuery>;
export type ControlWaiveType = z.infer<typeof ControlWaive>;
export type EvidenceAddType = z.infer<typeof EvidenceAdd>;
export type EvidenceQueryType = z.infer<typeof EvidenceQuery>;
export type CertTemplateUpsertType = z.infer<typeof CertTemplateUpsert>;
export type CertTemplateQueryType = z.infer<typeof CertTemplateQuery>;
export type CertSignReqType = z.infer<typeof CertSignReq>;
export type CertSignQueryType = z.infer<typeof CertSignQuery>;

export type ControlResponseType = z.infer<typeof ControlResponse>;
export type AssignmentResponseType = z.infer<typeof AssignmentResponse>;
export type ControlRunResponseType = z.infer<typeof ControlRunResponse>;
export type ExceptionResponseType = z.infer<typeof ExceptionResponse>;
export type EvidenceResponseType = z.infer<typeof EvidenceResponse>;
export type CertTemplateResponseType = z.infer<typeof CertTemplateResponse>;
export type CertSignoffResponseType = z.infer<typeof CertSignoffResponse>;
