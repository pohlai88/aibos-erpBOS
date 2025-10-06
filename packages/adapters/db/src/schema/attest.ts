import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const attestTaskStateEnum = pgEnum('attest_task_state', [
  'OPEN',
  'IN_PROGRESS',
  'SUBMITTED',
  'RETURNED',
  'APPROVED',
  'REVOKED',
]);

export const attestFrequencyEnum = pgEnum('attest_frequency', [
  'QUARTERLY',
  'ANNUAL',
  'ADHOC',
]);

export const attestTemplateStatusEnum = pgEnum('attest_template_status', [
  'ACTIVE',
  'RETIRED',
]);

export const attestCampaignStateEnum = pgEnum('attest_campaign_state', [
  'DRAFT',
  'ISSUED',
  'CLOSED',
  'ARCHIVED',
]);

export const attestSlaStateEnum = pgEnum('attest_sla_state', [
  'OK',
  'DUE_SOON',
  'LATE',
  'ESCALATED',
]);

// Attest Program Table
export const attestProgram = pgTable('attest_program', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  freq: text('freq').notNull(), // QUARTERLY|ANNUAL|ADHOC
  scope: text('scope').array().notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Template Table
export const attestTemplate = pgTable('attest_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  version: integer('version').notNull().default(1),
  schema: jsonb('schema').notNull(),
  requiresEvidence: boolean('requires_evidence').notNull().default(false),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE|RETIRED
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Campaign Table
export const attestCampaign = pgTable('attest_campaign', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  programId: uuid('program_id')
    .notNull()
    .references(() => attestProgram.id, { onDelete: 'restrict' }),
  templateId: uuid('template_id')
    .notNull()
    .references(() => attestTemplate.id, { onDelete: 'restrict' }),
  period: text('period').notNull(), // YYYY-Qn or YYYY
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  state: text('state').notNull().default('DRAFT'), // DRAFT|ISSUED|CLOSED|ARCHIVED
  meta: jsonb('meta').notNull().default({}),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Task Table
export const attestTask = pgTable('attest_task', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => attestCampaign.id, { onDelete: 'cascade' }),
  assigneeId: uuid('assignee_id').notNull(),
  scopeKey: text('scope_key').notNull(), // e.g., PROCESS:R2R or ENTITY:MY
  state: attestTaskStateEnum('state').notNull().default('OPEN'),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approverId: uuid('approver_id'),
  slaState: text('sla_state').notNull().default('OK'), // OK|DUE_SOON|LATE|ESCALATED
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Response Table
export const attestResponse = pgTable('attest_response', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => attestTask.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').notNull(), // keyed by question id
  exceptions: jsonb('exceptions').notNull().default([]), // array of {qId, type, note}
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Evidence Link Table
export const attestEvidenceLink = pgTable('attest_evidence_link', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => attestTask.id, { onDelete: 'cascade' }),
  evdRecordId: uuid('evd_record_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Pack Table
export const attestPack = pgTable('attest_pack', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .unique()
    .references(() => attestTask.id, { onDelete: 'cascade' }),
  manifest: jsonb('manifest').notNull(), // files, answers, signers
  sha256: text('sha256').notNull(), // content-addressed hash
  signerId: uuid('signer_id').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Attest Assignment Table
export const attestAssignment = pgTable('attest_assignment', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  programId: uuid('program_id')
    .notNull()
    .references(() => attestProgram.id, { onDelete: 'cascade' }),
  scopeKey: text('scope_key').notNull(), // PROCESS:*, PROCESS:R2R, ENTITY:MY, etc.
  assigneeId: uuid('assignee_id').notNull(),
  approverId: uuid('approver_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations will be defined in the main schema file to avoid circular imports
