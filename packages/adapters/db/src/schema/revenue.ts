import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
  date,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { rbContract, rbSubscription, rbProduct } from './rb.js';

// Revenue Recognition Core Tables (M25.1)

export const revPob = pgTable(
  'rev_pob',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    contractId: text('contract_id')
      .notNull()
      .references(() => rbContract.id, { onDelete: 'cascade' }),
    subscriptionId: text('subscription_id').references(() => rbSubscription.id),
    invoiceLineId: text('invoice_line_id'), // references future rb_invoice_line table
    productId: text('product_id')
      .notNull()
      .references(() => rbProduct.id),
    name: text('name').notNull(),
    method: text('method', {
      enum: ['POINT_IN_TIME', 'RATABLE_DAILY', 'RATABLE_MONTHLY', 'USAGE'],
    }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    qty: numeric('qty').notNull().default('1'),
    uom: text('uom'), // unit of measure
    ssp: numeric('ssp'), // standalone selling price
    allocatedAmount: numeric('allocated_amount').notNull(),
    currency: text('currency').notNull(),
    status: text('status', { enum: ['OPEN', 'FULFILLED', 'CANCELLED'] })
      .notNull()
      .default('OPEN'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    companyContractIdx: index('rev_pob_idx').on(
      table.companyId,
      table.contractId,
      table.status,
      table.startDate
    ),
    productIdx: index('rev_pob_product_idx').on(
      table.companyId,
      table.productId,
      table.status
    ),
    statusIdx: index('rev_pob_status_idx').on(
      table.companyId,
      table.status,
      table.startDate
    ),
    endDateIdx: index('rev_pob_end_date_idx').on(
      table.companyId,
      table.endDate
    ),
  })
);

export const revAllocLink = pgTable(
  'rev_alloc_link',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    pobId: text('pob_id')
      .notNull()
      .references(() => revPob.id, { onDelete: 'cascade' }),
    invoiceId: text('invoice_id').notNull(), // references future rb_invoice table
    invoiceLineId: text('invoice_line_id').notNull(), // references future rb_invoice_line table
    lineTxnAmount: numeric('line_txn_amount').notNull(),
    allocatedToPob: numeric('allocated_to_pob').notNull(),
  },
  table => ({
    pobIdx: index('rev_alloc_link_idx').on(table.companyId, table.pobId),
    invoiceIdx: index('rev_alloc_invoice_idx').on(
      table.companyId,
      table.invoiceId
    ),
  })
);

export const revSchedule = pgTable(
  'rev_schedule',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    pobId: text('pob_id')
      .notNull()
      .references(() => revPob.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    planned: numeric('planned').notNull(),
    recognized: numeric('recognized').notNull().default('0'),
    status: text('status', { enum: ['PLANNED', 'PARTIAL', 'DONE'] })
      .notNull()
      .default('PLANNED'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    uniquePobPeriod: unique('rev_schedule_unique').on(
      table.companyId,
      table.pobId,
      table.year,
      table.month
    ),
    periodIdx: index('rev_sched_idx').on(
      table.companyId,
      table.year,
      table.month,
      table.status
    ),
    pobIdx: index('rev_sched_pob_idx').on(
      table.companyId,
      table.pobId,
      table.year,
      table.month
    ),
    statusPobIdx: index('rev_sched_status_pob_idx').on(
      table.companyId,
      table.status,
      table.pobId
    ),
    periodStatusIdx: index('rev_sched_period_status_idx').on(
      table.companyId,
      table.year,
      table.month,
      table.status
    ),
  })
);

export const revRecRun = pgTable(
  'rev_rec_run',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    periodYear: integer('period_year').notNull(),
    periodMonth: integer('period_month').notNull(),
    status: text('status', { enum: ['DRAFT', 'POSTED', 'ERROR'] })
      .notNull()
      .default('DRAFT'),
    stats: jsonb('stats'), // run statistics
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    uniquePeriod: unique('rev_rec_run_unique').on(
      table.companyId,
      table.periodYear,
      table.periodMonth
    ),
    periodIdx: index('rev_rec_run_idx').on(
      table.companyId,
      table.periodYear,
      table.periodMonth
    ),
  })
);

export const revRecLine = pgTable(
  'rev_rec_line',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => revRecRun.id, { onDelete: 'cascade' }),
    companyId: text('company_id').notNull(),
    pobId: text('pob_id')
      .notNull()
      .references(() => revPob.id),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    amount: numeric('amount').notNull(),
    drAccount: text('dr_account').notNull(),
    crAccount: text('cr_account').notNull(),
    memo: text('memo'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    pobIdx: index('rev_rec_line_pob_idx').on(
      table.companyId,
      table.pobId,
      table.year,
      table.month
    ),
    accountIdx: index('rev_rec_line_account_idx').on(
      table.companyId,
      table.drAccount,
      table.crAccount
    ),
    runIdx: index('rev_rec_line_run_idx').on(table.runId),
  })
);

export const revEvent = pgTable(
  'rev_event',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    pobId: text('pob_id')
      .notNull()
      .references(() => revPob.id, { onDelete: 'cascade' }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    kind: text('kind', {
      enum: [
        'ACTIVATE',
        'FULFILL',
        'PAUSE',
        'RESUME',
        'CANCEL',
        'REFUND',
        'USAGE_REPORT',
      ],
    }).notNull(),
    payload: jsonb('payload'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    pobIdx: index('rev_event_idx').on(
      table.companyId,
      table.pobId,
      table.occurredAt
    ),
    kindIdx: index('rev_event_kind_idx').on(
      table.companyId,
      table.kind,
      table.occurredAt
    ),
    processedIdx: index('rev_event_processed_idx').on(
      table.companyId,
      table.processedAt
    ),
    unprocessedIdx: index('rev_event_unprocessed_idx').on(
      table.companyId,
      table.processedAt
    ),
    kindDateIdx: index('rev_event_kind_date_idx').on(
      table.companyId,
      table.kind,
      table.occurredAt
    ),
  })
);

export const revPolicy = pgTable('rev_policy', {
  companyId: text('company_id').primaryKey(),
  revAccount: text('rev_account').notNull(),
  unbilledArAccount: text('unbilled_ar_account').notNull(),
  deferredRevAccount: text('deferred_rev_account').notNull(),
  rounding: text('rounding', { enum: ['HALF_UP', 'BANKERS'] })
    .notNull()
    .default('HALF_UP'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

export const revProdPolicy = pgTable(
  'rev_prod_policy',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    productId: text('product_id')
      .notNull()
      .references(() => rbProduct.id, { onDelete: 'cascade' }),
    method: text('method', {
      enum: ['POINT_IN_TIME', 'RATABLE_DAILY', 'RATABLE_MONTHLY', 'USAGE'],
    }).notNull(),
    revAccount: text('rev_account'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    uniqueProduct: unique('rev_prod_policy_unique').on(
      table.companyId,
      table.productId
    ),
    productIdx: index('rev_prod_policy_idx').on(
      table.companyId,
      table.productId
    ),
  })
);

export const revRpoSnapshot = pgTable(
  'rev_rpo_snapshot',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    asOfDate: date('as_of_date').notNull(),
    currency: text('currency').notNull(),
    totalRpo: numeric('total_rpo').notNull().default('0'),
    dueWithin12m: numeric('due_within_12m').notNull().default('0'),
    dueAfter12m: numeric('due_after_12m').notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    uniqueDateCurrency: unique('rev_rpo_snapshot_unique').on(
      table.companyId,
      table.asOfDate,
      table.currency
    ),
    companyDateIdx: index('rev_rpo_idx').on(table.companyId, table.asOfDate),
    dateIdx: index('rev_rpo_date_idx').on(table.asOfDate),
  })
);

export const revPostLock = pgTable(
  'rev_post_lock',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    postedBy: text('posted_by').notNull(),
  },
  table => ({
    uniquePeriod: unique('rev_post_lock_unique').on(
      table.companyId,
      table.year,
      table.month
    ),
    periodIdx: index('rev_post_lock_idx').on(
      table.companyId,
      table.year,
      table.month
    ),
  })
);

export const revUsageBridge = pgTable(
  'rev_usage_bridge',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    pobId: text('pob_id')
      .notNull()
      .references(() => revPob.id, { onDelete: 'cascade' }),
    rollupId: text('rollup_id').notNull(),
    qty: numeric('qty').notNull(),
    ratedAmount: numeric('rated_amount').notNull(),
    periodYear: integer('period_year').notNull(),
    periodMonth: integer('period_month').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    uniquePobRollup: unique('rev_usage_bridge_unique').on(
      table.companyId,
      table.pobId,
      table.rollupId
    ),
    pobPeriodIdx: index('rev_usage_bridge_idx').on(
      table.companyId,
      table.pobId,
      table.periodYear,
      table.periodMonth
    ),
    rollupIdx: index('rev_usage_rollup_idx').on(
      table.companyId,
      table.rollupId
    ),
  })
);

export const revArtifact = pgTable(
  'rev_artifact',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => revRecRun.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['CSV', 'JSON'] }).notNull(),
    filename: text('filename').notNull(),
    sha256: text('sha256').notNull(),
    bytes: integer('bytes').notNull(),
    storageUri: text('storage_uri').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    runIdx: index('rev_artifact_run_idx').on(table.runId),
    kindIdx: index('rev_artifact_kind_idx').on(table.kind, table.createdAt),
  })
);

// M25.3: SSP Catalog & Evidence Tables
export const revSspCatalog = pgTable(
  'rev_ssp_catalog',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    productId: text('product_id')
      .notNull()
      .references(() => rbProduct.id, { onDelete: 'cascade' }),
    currency: text('currency').notNull(),
    ssp: numeric('ssp').notNull(),
    method: text('method', {
      enum: ['OBSERVABLE', 'BENCHMARK', 'ADJ_COST', 'RESIDUAL'],
    }).notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    corridorMinPct: numeric('corridor_min_pct'),
    corridorMaxPct: numeric('corridor_max_pct'),
    status: text('status', { enum: ['DRAFT', 'REVIEWED', 'APPROVED'] })
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
    companyProductIdx: index('rev_ssp_catalog_company_product_idx').on(
      table.companyId,
      table.productId,
      table.currency,
      table.effectiveFrom
    ),
    statusIdx: index('rev_ssp_catalog_status_idx').on(
      table.companyId,
      table.status,
      table.effectiveFrom
    ),
    effectiveIdx: index('rev_ssp_catalog_effective_idx').on(
      table.companyId,
      table.effectiveFrom,
      table.effectiveTo
    ),
    uniqueActive: unique('rev_ssp_catalog_unique_active').on(
      table.companyId,
      table.productId,
      table.currency,
      table.effectiveFrom
    ),
  })
);

export const revSspEvidence = pgTable(
  'rev_ssp_evidence',
  {
    id: text('id').primaryKey(),
    catalogId: text('catalog_id')
      .notNull()
      .references(() => revSspCatalog.id, { onDelete: 'cascade' }),
    source: text('source', {
      enum: ['OBSERVABLE', 'BENCHMARK', 'ADJ_COST', 'RESIDUAL'],
    }).notNull(),
    note: text('note'),
    value: numeric('value'),
    docUri: text('doc_uri'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    catalogIdx: index('rev_ssp_evidence_catalog_idx').on(table.catalogId),
  })
);

// SSP Policy Table
export const revSspPolicy = pgTable('rev_ssp_policy', {
  companyId: text('company_id').primaryKey(),
  rounding: text('rounding', { enum: ['HALF_UP', 'BANKERS'] })
    .notNull()
    .default('HALF_UP'),
  residualAllowed: boolean('residual_allowed').notNull().default(true),
  residualEligibleProducts: jsonb('residual_eligible_products').default([]),
  defaultMethod: text('default_method', {
    enum: ['OBSERVABLE', 'BENCHMARK', 'ADJ_COST', 'RESIDUAL'],
  })
    .notNull()
    .default('OBSERVABLE'),
  corridorTolerancePct: numeric('corridor_tolerance_pct').default('0.20'),
  alertThresholdPct: numeric('alert_threshold_pct').default('0.15'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

// Bundle Tables
export const revBundle = pgTable(
  'rev_bundle',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    bundleSku: text('bundle_sku').notNull(),
    name: text('name').notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    status: text('status', { enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
      .notNull()
      .default('ACTIVE'),
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
    companySkuIdx: index('rev_bundle_company_sku_idx').on(
      table.companyId,
      table.bundleSku,
      table.effectiveFrom
    ),
    statusIdx: index('rev_bundle_status_idx').on(
      table.companyId,
      table.status,
      table.effectiveFrom
    ),
    uniqueActive: unique('rev_bundle_unique_active').on(
      table.companyId,
      table.bundleSku,
      table.effectiveFrom
    ),
  })
);

export const revBundleComponent = pgTable(
  'rev_bundle_component',
  {
    id: text('id').primaryKey(),
    bundleId: text('bundle_id')
      .notNull()
      .references(() => revBundle.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => rbProduct.id, { onDelete: 'cascade' }),
    weightPct: numeric('weight_pct').notNull(),
    required: boolean('required').notNull().default(true),
    minQty: numeric('min_qty').default('1'),
    maxQty: numeric('max_qty'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    bundleIdx: index('rev_bundle_component_bundle_idx').on(table.bundleId),
    productIdx: index('rev_bundle_component_product_idx').on(table.productId),
  })
);

// Discount Rule Tables
export const revDiscountRule = pgTable(
  'rev_discount_rule',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    kind: text('kind', {
      enum: ['PROP', 'RESIDUAL', 'TIERED', 'PROMO', 'PARTNER'],
    }).notNull(),
    code: text('code').notNull(),
    name: text('name'),
    params: jsonb('params').notNull().default({}),
    active: boolean('active').notNull().default(true),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    priority: integer('priority').default(0),
    maxUsageCount: integer('max_usage_count'),
    maxUsageAmount: numeric('max_usage_amount'),
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
    companyCodeIdx: index('rev_discount_rule_company_code_idx').on(
      table.companyId,
      table.code,
      table.effectiveFrom
    ),
    activeIdx: index('rev_discount_rule_active_idx').on(
      table.companyId,
      table.active,
      table.effectiveFrom
    ),
    kindIdx: index('rev_discount_rule_kind_idx').on(
      table.companyId,
      table.kind,
      table.priority
    ),
    uniqueActive: unique('rev_discount_rule_unique_active').on(
      table.companyId,
      table.code,
      table.effectiveFrom
    ),
  })
);

export const revDiscountApplied = pgTable(
  'rev_discount_applied',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    invoiceId: text('invoice_id').notNull(),
    ruleId: text('rule_id')
      .notNull()
      .references(() => revDiscountRule.id),
    computedAmount: numeric('computed_amount').notNull(),
    detail: jsonb('detail').notNull().default({}),
    appliedAt: timestamp('applied_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    appliedBy: text('applied_by').notNull(),
  },
  table => ({
    invoiceIdx: index('rev_discount_applied_invoice_idx').on(
      table.companyId,
      table.invoiceId
    ),
    ruleIdx: index('rev_discount_applied_rule_idx').on(
      table.companyId,
      table.ruleId
    ),
  })
);

// Allocation Audit Table
export const revAllocAudit = pgTable(
  'rev_alloc_audit',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    invoiceId: text('invoice_id').notNull(),
    runId: text('run_id').notNull(),
    method: text('method', {
      enum: ['RELATIVE_SSP', 'RESIDUAL', 'ADJ_COST', 'AUTO'],
    }).notNull(),
    strategy: text('strategy', {
      enum: ['RELATIVE_SSP', 'RESIDUAL', 'AUTO'],
    }).notNull(),
    inputs: jsonb('inputs').notNull().default({}),
    results: jsonb('results').notNull().default({}),
    corridorFlag: boolean('corridor_flag').notNull().default(false),
    totalInvoiceAmount: numeric('total_invoice_amount').notNull(),
    totalAllocatedAmount: numeric('total_allocated_amount').notNull(),
    roundingAdjustment: numeric('rounding_adjustment').default('0'),
    processingTimeMs: integer('processing_time_ms'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  table => ({
    invoiceIdx: index('rev_alloc_audit_invoice_idx').on(
      table.companyId,
      table.invoiceId
    ),
    runIdx: index('rev_alloc_audit_run_idx').on(table.companyId, table.runId),
    methodIdx: index('rev_alloc_audit_method_idx').on(
      table.companyId,
      table.method,
      table.createdAt
    ),
    corridorIdx: index('rev_alloc_audit_corridor_idx').on(
      table.companyId,
      table.corridorFlag,
      table.createdAt
    ),
    createdIdx: index('rev_alloc_audit_created_idx').on(
      table.companyId,
      table.createdAt
    ),
  })
);

// SSP Change Governance Table
export const revSspChange = pgTable(
  'rev_ssp_change',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    requestor: text('requestor').notNull(),
    reason: text('reason').notNull(),
    diff: jsonb('diff').notNull().default({}),
    status: text('status', {
      enum: ['DRAFT', 'REVIEWED', 'APPROVED', 'REJECTED'],
    })
      .notNull()
      .default('DRAFT'),
    decidedBy: text('decided_by'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionNotes: text('decision_notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    companyStatusIdx: index('rev_ssp_change_company_status_idx').on(
      table.companyId,
      table.status,
      table.createdAt
    ),
    requestorIdx: index('rev_ssp_change_requestor_idx').on(
      table.companyId,
      table.requestor,
      table.createdAt
    ),
    decidedIdx: index('rev_ssp_change_decided_idx').on(
      table.companyId,
      table.decidedBy,
      table.decidedAt
    ),
  })
);
