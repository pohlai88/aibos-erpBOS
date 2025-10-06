import { z } from 'zod';

// --- M26.8: Auditor Workspace Contracts ---

// Enums
export const AuditGrantScopeSchema = z.enum([
  'ATTEST_PACK',
  'CTRL_RUN',
  'EVIDENCE',
  'REPORT',
  'EXTRACT',
]);
export const AuditAuditorStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'REVOKED',
]);
export const AuditRequestStateSchema = z.enum(['OPEN', 'RESPONDED', 'CLOSED']);
export const AuditRequestMsgAuthorKindSchema = z.enum([
  'AUDITOR',
  'OWNER',
  'SYSTEM',
]);
export const AuditAccessLogActionSchema = z.enum([
  'VIEW',
  'DOWNLOAD',
  'DENY',
  'EXPIRED',
]);

// Admin Management
export const AuditorUpsert = z.object({
  email: z.string().email(),
  display_name: z.string().min(1),
  status: AuditAuditorStatusSchema.default('ACTIVE'),
});

export const GrantUpsert = z.object({
  auditor_email: z.string().email(),
  scope: AuditGrantScopeSchema,
  object_id: z.string().min(1),
  can_download: z.boolean().default(false),
  expires_at: z.string().datetime(),
});

export const GrantRevoke = z.object({
  grant_id: z.string().uuid(),
});

// Session Management
export const AuditorLogin = z.object({
  email: z.string().email(),
});

export const AuditorSessionVerify = z.object({
  magic_code: z.string().min(1),
});

// Workspace Queries
export const PackQuery = z.object({
  search: z.string().optional(),
  period: z.string().optional(), // YYYY-MM format
  campaign_id: z.string().uuid().optional(),
  paging: z
    .object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    })
    .default({ limit: 50, offset: 0 }),
});

export const PackViewReq = z.object({
  id: z.string().uuid(),
});

export const DlRequest = z.object({
  grant_id: z.string().uuid(),
  object_id: z.string().min(1),
});

// Request Management
export const PbcOpen = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  due_at: z.string().datetime().optional(),
});

export const PbcReply = z.object({
  request_id: z.string().uuid(),
  body: z.string().min(1),
  evd_record_id: z.string().uuid().optional(),
});

// Watermark Policy
export const WatermarkPolicyUpsert = z.object({
  text_template: z
    .string()
    .min(1)
    .default('CONFIDENTIAL • {company} • {auditor_email} • {ts}'),
  diagonal: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(0.15),
  font_size: z.number().min(1).max(72).default(24),
  font_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#FF0000'),
});

// Response Types
export const AuditorResponseType = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string(),
  status: AuditAuditorStatusSchema,
  last_login_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const GrantResponseType = z.object({
  id: z.string().uuid(),
  auditor_id: z.string().uuid(),
  scope: AuditGrantScopeSchema,
  object_id: z.string(),
  can_download: z.boolean(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const AuditPackResponseType = z.object({
  id: z.string().uuid(),
  title: z.string(),
  sha256: z.string(),
  campaign_name: z.string(),
  task_title: z.string(),
  assignee_id: z.string().uuid(),
  created_at: z.string().datetime(),
  can_download: z.boolean(),
});

export const RequestResponseType = z.object({
  id: z.string().uuid(),
  title: z.string(),
  detail: z.string(),
  state: AuditRequestStateSchema,
  due_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  messages: z.array(
    z.object({
      id: z.string().uuid(),
      author_kind: AuditRequestMsgAuthorKindSchema,
      author_id: z.string().nullable(),
      body: z.string(),
      evd_record_id: z.string().uuid().nullable(),
      created_at: z.string().datetime(),
    })
  ),
});

export const AccessLogResponseType = z.object({
  id: z.number().int(),
  auditor_id: z.string().uuid(),
  session_id: z.string().uuid().nullable(),
  scope: AuditGrantScopeSchema,
  object_id: z.string(),
  action: AuditAccessLogActionSchema,
  ts: z.string().datetime(),
  meta: z.record(z.any()),
});

export const WatermarkPolicyResponseType = z.object({
  company_id: z.string(),
  text_template: z.string(),
  diagonal: z.boolean(),
  opacity: z.number(),
  font_size: z.number(),
  font_color: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Query Types
export const AuditorQuery = z.object({
  status: AuditAuditorStatusSchema.optional(),
  email: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const GrantQuery = z.object({
  auditor_id: z.string().uuid().optional(),
  scope: AuditGrantScopeSchema.optional(),
  object_id: z.string().optional(),
  can_download: z.boolean().optional(),
  expires_after: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const RequestQuery = z.object({
  auditor_id: z.string().uuid().optional(),
  state: AuditRequestStateSchema.optional(),
  due_after: z.string().datetime().optional(),
  due_before: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const AccessLogQuery = z.object({
  auditor_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  scope: AuditGrantScopeSchema.optional(),
  action: AuditAccessLogActionSchema.optional(),
  ts_after: z.string().datetime().optional(),
  ts_before: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

// Cron Job Types
export const AuditCronExpire = z.object({
  dry_run: z.boolean().default(false),
});

export const AuditCronRemind = z.object({
  grant_hours_ahead: z.number().int().min(1).max(168).default(24), // 1 hour to 1 week
  request_hours_overdue: z.number().int().min(1).max(168).default(24),
});
