import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// M26: Close Orchestrator Core Tables

export const closeRun = pgTable(
  'close_run',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    status: text('status', {
      enum: [
        'DRAFT',
        'IN_PROGRESS',
        'REVIEW',
        'APPROVED',
        'PUBLISHED',
        'ABORTED',
      ],
    })
      .notNull()
      .default('DRAFT'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    owner: text('owner').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    uniquePeriod: unique('close_run_unique').on(
      table.companyId,
      table.year,
      table.month
    ),
    companyPeriodIdx: index('close_run_company_period_idx').on(
      table.companyId,
      table.year,
      table.month
    ),
    statusIdx: index('close_run_status_idx').on(
      table.companyId,
      table.status,
      table.startedAt
    ),
    ownerStatusIdx: index('close_run_owner_status_idx').on(
      table.owner,
      table.status,
      table.startedAt
    ),
    closedAtIdx: index('close_run_closed_at_idx').on(table.closedAt),
  })
);

export const closeTask = pgTable(
  'close_task',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => closeRun.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    owner: text('owner').notNull(),
    slaDueAt: timestamp('sla_due_at', { withTimezone: true }),
    status: text('status', {
      enum: ['OPEN', 'BLOCKED', 'READY', 'DONE', 'REJECTED'],
    })
      .notNull()
      .default('OPEN'),
    priority: integer('priority').default(0),
    tags: text('tags').array(),
    evidenceRequired: boolean('evidence_required').notNull().default(false),
    approver: text('approver'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    uniqueRunCode: unique('close_task_unique').on(table.runId, table.code),
    runStatusIdx: index('close_task_run_status_idx').on(
      table.runId,
      table.status
    ),
    statusSlaIdx: index('close_task_status_sla_idx').on(
      table.status,
      table.slaDueAt
    ),
    ownerIdx: index('close_task_owner_idx').on(table.owner, table.status),
    priorityStatusIdx: index('close_task_priority_status_idx').on(
      table.priority,
      table.status
    ),
  })
);

export const closeDep = pgTable(
  'close_dep',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => closeRun.id, { onDelete: 'cascade' }),
    taskId: text('task_id')
      .notNull()
      .references(() => closeTask.id, { onDelete: 'cascade' }),
    dependsOnTaskId: text('depends_on_task_id')
      .notNull()
      .references(() => closeTask.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    uniqueTaskDep: unique('close_dep_unique').on(
      table.taskId,
      table.dependsOnTaskId
    ),
    taskIdx: index('close_dep_task_idx').on(table.taskId),
    dependsIdx: index('close_dep_depends_idx').on(table.dependsOnTaskId),
  })
);

export const closeEvidence = pgTable(
  'close_evidence',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => closeRun.id, { onDelete: 'cascade' }),
    taskId: text('task_id')
      .notNull()
      .references(() => closeTask.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['LINK', 'FILE', 'NOTE'] }).notNull(),
    uriOrNote: text('uri_or_note').notNull(),
    addedBy: text('added_by').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    taskIdx: index('close_evidence_task_idx').on(table.taskId),
    runIdx: index('close_evidence_run_idx').on(table.runId),
    kindIdx: index('close_evidence_kind_idx').on(table.kind, table.addedAt),
  })
);

export const closePolicy = pgTable('close_policy', {
  companyId: text('company_id').primaryKey(),
  materialityAbs: numeric('materiality_abs').notNull().default('10000'),
  materialityPct: numeric('materiality_pct').notNull().default('0.02'),
  slaDefaultHours: integer('sla_default_hours').notNull().default(72),
  reminderCadenceMins: integer('reminder_cadence_mins').notNull().default(60),
  tz: text('tz').notNull().default('UTC'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

export const closeLock = pgTable(
  'close_lock',
  {
    companyId: text('company_id').notNull(),
    entityId: text('entity_id').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    lockedBy: text('locked_by').notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    primaryKey: unique('close_lock_pk').on(
      table.companyId,
      table.entityId,
      table.year,
      table.month
    ),
    periodIdx: index('close_lock_period_idx').on(
      table.companyId,
      table.year,
      table.month
    ),
  })
);

export const closeKpi = pgTable(
  'close_kpi',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    runId: text('run_id').references(() => closeRun.id, {
      onDelete: 'cascade',
    }),
    metric: text('metric', {
      enum: ['DAYS_TO_CLOSE', 'ON_TIME_RATE', 'AVG_TASK_AGE', 'LATE_TASKS'],
    }).notNull(),
    value: numeric('value').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyMetricIdx: index('close_kpi_company_metric_idx').on(
      table.companyId,
      table.metric,
      table.computedAt
    ),
    runIdx: index('close_kpi_run_idx').on(table.runId),
    computedIdx: index('close_kpi_computed_idx').on(table.computedAt),
    metricValueIdx: index('close_kpi_metric_value_idx').on(
      table.metric,
      table.value,
      table.computedAt
    ),
  })
);

// M26: Flux Analysis Tables

export const fluxRule = pgTable(
  'flux_rule',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    scope: text('scope', { enum: ['PL', 'BS', 'CF'] }).notNull(),
    dim: text('dim', {
      enum: ['ACCOUNT', 'COST_CENTER', 'PROJECT', 'NONE'],
    }).notNull(),
    thresholdAbs: numeric('threshold_abs'),
    thresholdPct: numeric('threshold_pct'),
    requireComment: boolean('require_comment').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    companyScopeIdx: index('flux_rule_company_scope_idx').on(
      table.companyId,
      table.scope,
      table.active
    ),
  })
);

export const fluxRun = pgTable(
  'flux_run',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    runId: text('run_id').references(() => closeRun.id, {
      onDelete: 'cascade',
    }),
    baseYear: integer('base_year').notNull(),
    baseMonth: integer('base_month').notNull(),
    cmpYear: integer('cmp_year').notNull(),
    cmpMonth: integer('cmp_month').notNull(),
    presentCcy: text('present_ccy').notNull(),
    status: text('status', { enum: ['RUNNING', 'COMPLETED', 'ERROR'] })
      .notNull()
      .default('RUNNING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    companyPeriodIdx: index('flux_run_company_period_idx').on(
      table.companyId,
      table.cmpYear,
      table.cmpMonth
    ),
    statusIdx: index('flux_run_status_idx').on(
      table.companyId,
      table.status,
      table.createdAt
    ),
    companyCmpPeriodIdx: index('flux_run_company_cmp_period_idx').on(
      table.companyId,
      table.cmpYear,
      table.cmpMonth,
      table.createdAt
    ),
  })
);

export const fluxLine = pgTable(
  'flux_line',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => fluxRun.id, { onDelete: 'cascade' }),
    accountCode: text('account_code').notNull(),
    dimKey: text('dim_key'),
    baseAmount: numeric('base_amount').notNull().default('0'),
    cmpAmount: numeric('cmp_amount').notNull().default('0'),
    delta: numeric('delta').notNull().default('0'),
    deltaPct: numeric('delta_pct').notNull().default('0'),
    requiresComment: boolean('requires_comment').notNull().default(false),
    material: boolean('material').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    runIdx: index('flux_line_run_idx').on(table.runId),
    materialIdx: index('flux_line_material_idx').on(table.material),
    accountIdx: index('flux_line_account_idx').on(table.accountCode),
    materialDescIdx: index('flux_line_material_desc_idx').on(
      table.material,
      table.delta
    ),
  })
);

export const fluxComment = pgTable(
  'flux_comment',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => fluxRun.id, { onDelete: 'cascade' }),
    lineId: text('line_id')
      .notNull()
      .references(() => fluxLine.id, { onDelete: 'cascade' }),
    author: text('author').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    lineIdx: index('flux_comment_line_idx').on(table.lineId),
    runIdx: index('flux_comment_run_idx').on(table.runId),
  })
);

// M26: MD&A Tables

export const mdnaTemplate = pgTable(
  'mdna_template',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    name: text('name').notNull(),
    sections: jsonb('sections').notNull().default({}),
    variables: jsonb('variables').notNull().default({}),
    status: text('status', { enum: ['DRAFT', 'APPROVED'] })
      .notNull()
      .default('DRAFT'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    companyStatusIdx: index('mdna_template_company_status_idx').on(
      table.companyId,
      table.status
    ),
  })
);

export const mdnaDraft = pgTable(
  'mdna_draft',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    runId: text('run_id').references(() => closeRun.id, {
      onDelete: 'cascade',
    }),
    templateId: text('template_id')
      .notNull()
      .references(() => mdnaTemplate.id, { onDelete: 'cascade' }),
    content: jsonb('content').notNull().default({}),
    variables: jsonb('variables').notNull().default({}),
    status: text('status', { enum: ['EDITING', 'REVIEW', 'APPROVED'] })
      .notNull()
      .default('EDITING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    companyRunIdx: index('mdna_draft_company_run_idx').on(
      table.companyId,
      table.runId
    ),
    templateIdx: index('mdna_draft_template_idx').on(table.templateId),
    statusIdx: index('mdna_draft_status_idx').on(table.companyId, table.status),
  })
);

export const mdnaPublish = pgTable(
  'mdna_publish',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    runId: text('run_id').references(() => closeRun.id, {
      onDelete: 'cascade',
    }),
    draftId: text('draft_id')
      .notNull()
      .references(() => mdnaDraft.id, { onDelete: 'cascade' }),
    htmlUri: text('html_uri').notNull(),
    checksum: text('checksum').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedBy: text('published_by').notNull(),
  },
  table => ({
    companyRunIdx: index('mdna_publish_company_run_idx').on(
      table.companyId,
      table.runId
    ),
    draftIdx: index('mdna_publish_draft_idx').on(table.draftId),
  })
);
