import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  jsonb,
  numeric,
  bigint,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- M26.8: Auditor Workspace Schema ---

// Enums
export const auditGrantScopeEnum = pgEnum('audit_grant_scope', [
  'ATTEST_PACK',
  'CTRL_RUN',
  'EVIDENCE',
  'REPORT',
  'EXTRACT',
]);

// Auditor accounts (external) with company-scoped, time-boxed access
export const auditAuditor = pgTable(
  'audit_auditor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE|SUSPENDED|REVOKED
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyEmailIdx: index('idx_audit_auditor_company_email').on(
      table.companyId,
      table.email
    ),
    companyStatusIdx: index('idx_audit_auditor_company_status').on(
      table.companyId,
      table.status
    ),
  })
);

// Least-privilege grants for specific objects
export const auditGrant = pgTable(
  'audit_grant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    auditorId: uuid('auditor_id')
      .notNull()
      .references(() => auditAuditor.id, { onDelete: 'cascade' }),
    scope: auditGrantScopeEnum('scope').notNull(),
    objectId: text('object_id').notNull(),
    canDownload: boolean('can_download').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    auditorExpiresIdx: index('idx_audit_grant_auditor_expires').on(
      table.auditorId,
      table.expiresAt
    ),
    scopeObjectIdx: index('idx_audit_grant_scope_object').on(
      table.scope,
      table.objectId
    ),
    companyScopeObjectIdx: index('idx_audit_grant_company_scope_object').on(
      table.companyId,
      table.scope,
      table.objectId
    ),
  })
);

// Auditor session management
export const auditSession = pgTable(
  'audit_session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    auditorId: uuid('auditor_id')
      .notNull()
      .references(() => auditAuditor.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    ip: text('ip'),
    ua: text('ua'),
    signedAt: timestamp('signed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  table => ({
    auditorExpiresIdx: index('idx_audit_session_auditor_expires').on(
      table.auditorId,
      table.expiresAt
    ),
  })
);

// End-to-end audit trail
export const auditAccessLog = pgTable(
  'audit_access_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    companyId: text('company_id').notNull(),
    auditorId: uuid('auditor_id').notNull(),
    sessionId: uuid('session_id'),
    scope: auditGrantScopeEnum('scope').notNull(),
    objectId: text('object_id').notNull(),
    action: text('action').notNull(), // VIEW|DOWNLOAD|DENY|EXPIRED
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb('meta').notNull().default({}),
  },
  table => ({
    companyAuditorTsIdx: index('idx_audit_access_log_company_auditor_ts').on(
      table.companyId,
      table.auditorId,
      table.ts
    ),
    sessionActionTsIdx: index('idx_audit_access_log_session_action_ts').on(
      table.sessionId,
      table.action,
      table.ts
    ),
  })
);

// PBC / follow-up requests from auditors
export const auditRequest = pgTable(
  'audit_request',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: text('company_id').notNull(),
    auditorId: uuid('auditor_id')
      .notNull()
      .references(() => auditAuditor.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    state: text('state').notNull().default('OPEN'), // OPEN|RESPONDED|CLOSED
    dueAt: timestamp('due_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyStateDueIdx: index('idx_audit_request_company_state_due').on(
      table.companyId,
      table.state,
      table.dueAt
    ),
    auditorStateIdx: index('idx_audit_request_auditor_state').on(
      table.auditorId,
      table.state,
      table.createdAt
    ),
  })
);

// Threaded Q&A & responses
export const auditRequestMsg = pgTable(
  'audit_request_msg',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => auditRequest.id, { onDelete: 'cascade' }),
    authorKind: text('author_kind').notNull(), // AUDITOR|OWNER|SYSTEM
    authorId: text('author_id'),
    body: text('body').notNull(),
    evdRecordId: text('evd_record_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    requestCreatedIdx: index('idx_audit_request_msg_request_created').on(
      table.requestId,
      table.createdAt
    ),
  })
);

// Watermark policy configuration per company
export const auditWatermarkPolicy = pgTable('audit_watermark_policy', {
  companyId: text('company_id').primaryKey(),
  textTemplate: text('text_template')
    .notNull()
    .default('CONFIDENTIAL • {company} • {auditor_email} • {ts}'),
  diagonal: boolean('diagonal').notNull().default(true),
  opacity: numeric('opacity').notNull().default('0.15'),
  fontSize: numeric('font_size').notNull().default('24'),
  fontColor: text('font_color').notNull().default('#FF0000'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Short-lived signed URL keys for downloads (defense in depth)
export const auditDlKey = pgTable(
  'audit_dl_key',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    grantId: uuid('grant_id')
      .notNull()
      .references(() => auditGrant.id, { onDelete: 'cascade' }),
    keyHash: text('key_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    grantExpiresIdx: index('idx_audit_dl_key_grant_expires').on(
      table.grantId,
      table.expiresAt
    ),
    keyHashExpiresIdx: index('idx_audit_dl_key_key_hash_expires').on(
      table.keyHash,
      table.expiresAt
    ),
  })
);

// Relations
export const auditAuditorRelations = relations(auditAuditor, ({ many }) => ({
  grants: many(auditGrant),
  sessions: many(auditSession),
  requests: many(auditRequest),
  accessLogs: many(auditAccessLog),
}));

export const auditGrantRelations = relations(auditGrant, ({ one, many }) => ({
  auditor: one(auditAuditor, {
    fields: [auditGrant.auditorId],
    references: [auditAuditor.id],
  }),
  downloadKeys: many(auditDlKey),
}));

export const auditSessionRelations = relations(
  auditSession,
  ({ one, many }) => ({
    auditor: one(auditAuditor, {
      fields: [auditSession.auditorId],
      references: [auditAuditor.id],
    }),
    accessLogs: many(auditAccessLog),
  })
);

export const auditRequestRelations = relations(
  auditRequest,
  ({ one, many }) => ({
    auditor: one(auditAuditor, {
      fields: [auditRequest.auditorId],
      references: [auditAuditor.id],
    }),
    messages: many(auditRequestMsg),
  })
);

export const auditRequestMsgRelations = relations(
  auditRequestMsg,
  ({ one }) => ({
    request: one(auditRequest, {
      fields: [auditRequestMsg.requestId],
      references: [auditRequest.id],
    }),
  })
);

export const auditDlKeyRelations = relations(auditDlKey, ({ one }) => ({
  grant: one(auditGrant, {
    fields: [auditDlKey.grantId],
    references: [auditGrant.id],
  }),
}));
