import { z } from 'zod';

// Enums
export const AttestFrequencySchema = z.enum(['QUARTERLY', 'ANNUAL', 'ADHOC']);
export const AttestTemplateStatusSchema = z.enum(['ACTIVE', 'RETIRED']);
export const AttestCampaignStateSchema = z.enum([
  'DRAFT',
  'ISSUED',
  'CLOSED',
  'ARCHIVED',
]);
export const AttestTaskStateSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'SUBMITTED',
  'RETURNED',
  'APPROVED',
  'REVOKED',
]);
export const AttestSlaStateSchema = z.enum([
  'OK',
  'DUE_SOON',
  'LATE',
  'ESCALATED',
]);

// Question Types
export const QuestionTypeSchema = z.enum([
  'YN',
  'TEXT',
  'MULTI_SELECT',
  'EVIDENCE',
  'ATTACHMENT',
]);

export const QuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: QuestionTypeSchema,
  requireEvidence: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for MULTI_SELECT
  required: z.boolean().default(true),
});

export const TemplateSchemaSchema = z.object({
  version: z.number().int().min(1),
  questions: z.array(QuestionSchema),
});

// Program Schemas
export const ProgramUpsertSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  freq: AttestFrequencySchema,
  scope: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export const ProgramResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  freq: AttestFrequencySchema,
  scope: z.array(z.string()),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Template Schemas
export const TemplateUpsertSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  version: z.number().int().min(1).default(1),
  schema: TemplateSchemaSchema,
  requiresEvidence: z.boolean().default(false),
  status: AttestTemplateStatusSchema.default('ACTIVE'),
});

export const TemplateResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  version: z.number().int(),
  schema: TemplateSchemaSchema,
  requiresEvidence: z.boolean(),
  status: AttestTemplateStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Assignment Schemas
export const AssignmentUpsertSchema = z.object({
  programCode: z.string().min(1),
  scopeKey: z.string().min(1),
  assigneeId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
});

export const AssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  programId: z.string().uuid(),
  scopeKey: z.string(),
  assigneeId: z.string().uuid(),
  approverId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

// Campaign Schemas
export const CampaignIssueReqSchema = z.object({
  programCode: z.string().min(1),
  templateCode: z.string().min(1),
  period: z.string().regex(/^\d{4}-Q[1-4]$|^\d{4}$/), // YYYY-Qn or YYYY
  dueAt: z.string().datetime(),
  meta: z.record(z.any()).optional(),
});

export const CampaignResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  programId: z.string().uuid(),
  templateId: z.string().uuid(),
  period: z.string(),
  dueAt: z.string().datetime(),
  state: AttestCampaignStateSchema,
  meta: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Task Schemas
export const TaskQuerySchema = z.object({
  campaignId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  state: z.array(AttestTaskStateSchema).optional(),
  slaState: z.array(AttestSlaStateSchema).optional(),
  scopeKey: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  campaignId: z.string().uuid(),
  assigneeId: z.string().uuid(),
  scopeKey: z.string(),
  state: AttestTaskStateSchema,
  dueAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable(),
  approvedAt: z.string().datetime().nullable(),
  approverId: z.string().uuid().nullable(),
  slaState: AttestSlaStateSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Response Schemas
export const ExceptionSchema = z.object({
  qId: z.string(),
  type: z.string(),
  note: z.string(),
});

export const TaskSubmitSchema = z.object({
  taskId: z.string().uuid(),
  answers: z.record(z.any()), // keyed by question id
  exceptions: z.array(ExceptionSchema).default([]),
  evidenceIds: z.array(z.string().uuid()).optional(),
});

export const TaskReturnSchema = z.object({
  taskId: z.string().uuid(),
  reason: z.string().min(1),
});

export const TaskApproveSchema = z.object({
  taskId: z.string().uuid(),
});

// Pack Schemas
export const PackSignReqSchema = z.object({
  taskId: z.string().uuid(),
});

export const PackDownloadReqSchema = z.object({
  taskId: z.string().uuid(),
  format: z.enum(['json', 'zip']).default('json'),
});

export const PackManifestSchema = z.object({
  taskId: z.string().uuid(),
  template: z.object({
    code: z.string(),
    version: z.number().int(),
  }),
  answers: z.record(z.any()),
  evidence: z.array(
    z.object({
      evdRecordId: z.string().uuid(),
      sha256: z.string(),
      name: z.string(),
    })
  ),
  assignee: z.object({
    id: z.string().uuid(),
    display: z.string(),
  }),
  timestamps: z.object({
    issued: z.string().datetime(),
    submitted: z.string().datetime().nullable(),
    approved: z.string().datetime().nullable(),
  }),
  sha256: z.string(),
});

export const PackResponseSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  manifest: PackManifestSchema,
  sha256: z.string(),
  signerId: z.string().uuid(),
  signedAt: z.string().datetime(),
});

// Summary Schemas
export const CampaignSummaryReqSchema = z.object({
  campaignId: z.string().uuid(),
});

export const CampaignSummaryResponseSchema = z.object({
  campaignId: z.string().uuid(),
  period: z.string(),
  programName: z.string(),
  templateTitle: z.string(),
  dueAt: z.string().datetime(),
  state: AttestCampaignStateSchema,
  late: z.number().int(),
  escalated: z.number().int(),
  openCnt: z.number().int(),
  submittedCnt: z.number().int(),
  approvedCnt: z.number().int(),
  total: z.number().int(),
  completionRate: z.number().min(0).max(100),
});

// Heat Map Schema
export const AttestHeatMapRowSchema = z.object({
  scopeKey: z.string(),
  late: z.number().int(),
  escalated: z.number().int(),
  openCnt: z.number().int(),
  submittedCnt: z.number().int(),
  approvedCnt: z.number().int(),
  total: z.number().int(),
});

export const AttestHeatMapResponseSchema = z.array(AttestHeatMapRowSchema);

// Type exports
export type AttestFrequencyType = z.infer<typeof AttestFrequencySchema>;
export type AttestTemplateStatusType = z.infer<
  typeof AttestTemplateStatusSchema
>;
export type AttestCampaignStateType = z.infer<typeof AttestCampaignStateSchema>;
export type AttestTaskStateType = z.infer<typeof AttestTaskStateSchema>;
export type AttestSlaStateType = z.infer<typeof AttestSlaStateSchema>;
export type QuestionTypeType = z.infer<typeof QuestionTypeSchema>;

export type QuestionType = z.infer<typeof QuestionSchema>;
export type TemplateSchemaType = z.infer<typeof TemplateSchemaSchema>;

export type AttestProgramUpsertType = z.infer<typeof ProgramUpsertSchema>;
export type AttestProgramResponseType = z.infer<typeof ProgramResponseSchema>;

export type AttestTemplateUpsertType = z.infer<typeof TemplateUpsertSchema>;
export type AttestTemplateResponseType = z.infer<typeof TemplateResponseSchema>;

export type AttestAssignmentUpsertType = z.infer<typeof AssignmentUpsertSchema>;
export type AttestAssignmentResponseType = z.infer<
  typeof AssignmentResponseSchema
>;

export type CampaignIssueReqType = z.infer<typeof CampaignIssueReqSchema>;
export type CampaignResponseType = z.infer<typeof CampaignResponseSchema>;

export type TaskQueryType = z.infer<typeof TaskQuerySchema>;
export type TaskResponseType = z.infer<typeof TaskResponseSchema>;

export type ExceptionType = z.infer<typeof ExceptionSchema>;
export type TaskSubmitType = z.infer<typeof TaskSubmitSchema>;
export type TaskReturnType = z.infer<typeof TaskReturnSchema>;
export type TaskApproveType = z.infer<typeof TaskApproveSchema>;

export type PackSignReqType = z.infer<typeof PackSignReqSchema>;
export type PackDownloadReqType = z.infer<typeof PackDownloadReqSchema>;
export type PackManifestType = z.infer<typeof PackManifestSchema>;
export type PackResponseType = z.infer<typeof PackResponseSchema>;

export type CampaignSummaryReqType = z.infer<typeof CampaignSummaryReqSchema>;
export type CampaignSummaryResponseType = z.infer<
  typeof CampaignSummaryResponseSchema
>;

export type AttestHeatMapRowType = z.infer<typeof AttestHeatMapRowSchema>;
export type AttestHeatMapResponseType = z.infer<
  typeof AttestHeatMapResponseSchema
>;
