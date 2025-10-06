import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  date,
  primaryKey,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

// --- M26.1: Auto-Controls & Certifications Schema ---

// Controls Library Table
export const ctrlControl = pgTable('ctrl_control', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  purpose: text('purpose').notNull(),
  domain: text('domain').notNull(), // CLOSE, AP, AR, REV, FX, BANK, INV, FIXEDASSET
  frequency: text('frequency').notNull(), // PER_RUN, MONTHLY, QUARTERLY, ANNUAL, ADHOC
  severity: text('severity').notNull(), // LOW, MEDIUM, HIGH
  autoKind: text('auto_kind').notNull(), // NONE, SQL, SCRIPT, POLICY
  autoConfig: jsonb('auto_config'),
  evidenceRequired: boolean('evidence_required').notNull().default(false),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
});

// Control Assignments Table
export const ctrlAssignment = pgTable('ctrl_assignment', {
  id: text('id').primaryKey(),
  controlId: text('control_id')
    .notNull()
    .references(() => ctrlControl.id, { onDelete: 'cascade' }),
  runId: text('run_id').references(() => closeRun.id, { onDelete: 'cascade' }),
  taskId: text('task_id').references(() => closeTask.id, {
    onDelete: 'cascade',
  }),
  entityId: text('entity_id'), // For entity-specific controls
  owner: text('owner').notNull(),
  approver: text('approver').notNull(),
  slaDueAt: timestamp('sla_due_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
});

// Control Runs Table
export const ctrlRun = pgTable('ctrl_run', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  controlId: text('control_id')
    .notNull()
    .references(() => ctrlControl.id, { onDelete: 'cascade' }),
  assignmentId: text('assignment_id').references(() => ctrlAssignment.id, {
    onDelete: 'cascade',
  }),
  runId: text('run_id').references(() => closeRun.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull().default('QUEUED'), // QUEUED, RUNNING, PASS, FAIL, WAIVED
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Control Results Table
export const ctrlResult = pgTable('ctrl_result', {
  id: text('id').primaryKey(),
  ctrlRunId: text('ctrl_run_id')
    .notNull()
    .references(() => ctrlRun.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // PASS, FAIL, WAIVED
  detail: jsonb('detail').notNull().default({}),
  sampleCount: integer('sample_count').notNull().default(0),
  exceptionsCount: integer('exceptions_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Control Exceptions Table
export const ctrlException = pgTable('ctrl_exception', {
  id: text('id').primaryKey(),
  ctrlRunId: text('ctrl_run_id')
    .notNull()
    .references(() => ctrlRun.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  message: text('message').notNull(),
  itemRef: text('item_ref'), // Reference to specific item that failed
  material: boolean('material').notNull().default(false),
  remediationState: text('remediation_state').notNull().default('OPEN'), // OPEN, IN_PROGRESS, RESOLVED, WAIVED
  assignee: text('assignee'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNote: text('resolution_note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

// Control Evidence Table
export const ctrlEvidence = pgTable('ctrl_evidence', {
  id: text('id').primaryKey(),
  ctrlRunId: text('ctrl_run_id')
    .notNull()
    .references(() => ctrlRun.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // LINK, FILE, NOTE, SNAPSHOT
  uriOrNote: text('uri_or_note').notNull(),
  checksum: text('checksum'), // SHA256 hash for immutability verification
  addedBy: text('added_by').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});

// Certification Statements Table
export const certStatement = pgTable('cert_statement', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(),
  text: text('text').notNull(),
  level: text('level').notNull(), // ENTITY, CONSOLIDATED
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
});

// Certification Sign-offs Table
export const certSignoff = pgTable('cert_signoff', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  runId: text('run_id')
    .notNull()
    .references(() => closeRun.id, { onDelete: 'cascade' }),
  level: text('level').notNull(), // ENTITY, CONSOLIDATED
  signerRole: text('signer_role').notNull(), // MANAGER, CONTROLLER, CFO
  signerName: text('signer_name').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  statementId: text('statement_id')
    .notNull()
    .references(() => certStatement.id, { onDelete: 'restrict' }),
  statementText: text('statement_text').notNull(), // Snapshot of statement text at time of signing
  snapshotUri: text('snapshot_uri'), // URI to immutable snapshot of financial statements
  checksum: text('checksum').notNull(), // SHA256 hash of snapshot for integrity verification
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Import close tables for foreign key references
import { closeRun, closeTask } from './close.js';
