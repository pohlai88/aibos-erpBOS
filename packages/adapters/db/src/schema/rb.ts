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

// --- Revenue & Billing (M25) ------------------------------------------------

// Tax Code table for tax calculation
export const taxCode = pgTable('tax_code', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  rate: numeric('rate').notNull().default('0'), // Tax rate as decimal (e.g., 0.20 for 20%)
  type: text('type').notNull(), // 'SALES', 'PURCHASE', 'VAT', etc.
  status: text('status').notNull().default('ACTIVE'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

// Catalog Tables
export const rbProduct = pgTable('rb_product', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  sku: text('sku').notNull(), // unique per company
  name: text('name').notNull(),
  kind: text('kind').notNull(), // 'ONE_TIME','RECURRING','USAGE'
  glRevAcct: text('gl_rev_acct'), // optional, else policy
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE','INACTIVE'
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

export const rbPriceBook = pgTable('rb_price_book', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(), // 'DEFAULT','ENTERPRISE'
  currency: text('currency').notNull(),
  active: boolean('active').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

export const rbPrice = pgTable('rb_price', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  productId: text('product_id')
    .notNull()
    .references(() => rbProduct.id, { onDelete: 'cascade' }),
  bookId: text('book_id')
    .notNull()
    .references(() => rbPriceBook.id, { onDelete: 'cascade' }),
  model: text('model').notNull(), // 'FLAT','TIERED','STAIR','VOLUME'
  unitAmount: numeric('unit_amount'), // FLAT baseline
  unit: text('unit'), // 'seat','GB','txn'
  interval: text('interval'), // 'DAY','WEEK','MONTH','YEAR'
  intervalCount: integer('interval_count').default(1),
  minQty: numeric('min_qty').default('0'),
  maxQty: numeric('max_qty'),
  meta: jsonb('meta'),
});

// Contracts Tables
export const rbContract = pgTable('rb_contract', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  customerId: text('customer_id').notNull(),
  bookId: text('book_id')
    .notNull()
    .references(() => rbPriceBook.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status').notNull().default('ACTIVE'), // 'DRAFT','ACTIVE','SUSPENDED','CANCELLED'
  terms: jsonb('terms'), // custom caps, discounts, fx, etc.
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

export const rbSubscription = pgTable('rb_subscription', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  contractId: text('contract_id')
    .notNull()
    .references(() => rbContract.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => rbProduct.id),
  priceId: text('price_id')
    .notNull()
    .references(() => rbPrice.id),
  qty: numeric('qty').notNull().default('1'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  billAnchor: date('bill_anchor').notNull(), // anchor day for cycle
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE','PAUSED','CANCELLED'
  proration: text('proration').notNull().default('DAILY'), // 'DAILY','NONE'
  meta: jsonb('meta'),
});

// Usage Tables
export const rbUsageEvent = pgTable('rb_usage_event', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id')
    .notNull()
    .references(() => rbSubscription.id, { onDelete: 'cascade' }),
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  quantity: numeric('quantity').notNull(),
  unit: text('unit').notNull(),
  uniqHash: text('uniq_hash').notNull(), // idempotency / dedupe
  payload: jsonb('payload'),
});

export const rbUsageRollup = pgTable('rb_usage_rollup', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  subscriptionId: text('subscription_id').notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  unit: text('unit').notNull(),
  qty: numeric('qty').notNull(),
  meta: jsonb('meta'),
});

// Invoice Tables
export const rbInvoice = pgTable('rb_invoice', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  customerId: text('customer_id').notNull(),
  presentCcy: text('present_ccy').notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  status: text('status').notNull().default('DRAFT'), // 'DRAFT','FINAL','VOID','PAID','PARTIAL'
  subtotal: numeric('subtotal').notNull().default('0'),
  taxTotal: numeric('tax_total').notNull().default('0'),
  total: numeric('total').notNull().default('0'),
  fxPresentRate: numeric('fx_present_rate'), // snapshot for present ccy
  portalLink: text('portal_link'), // cached for emails/portal
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const rbInvoiceLine = pgTable('rb_invoice_line', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => rbInvoice.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),
  kind: text('kind').notNull(), // 'ONE_TIME','RECURRING','USAGE','CREDIT','ADJUSTMENT','ROUNDING'
  productId: text('product_id'),
  description: text('description').notNull(),
  qty: numeric('qty').notNull().default('1'),
  unit: text('unit'),
  unitPrice: numeric('unit_price').notNull(),
  lineSubtotal: numeric('line_subtotal').notNull(),
  taxCode: text('tax_code'), // join to your tax engine
  taxAmount: numeric('tax_amount').notNull().default('0'),
  lineTotal: numeric('line_total').notNull(),
});

// Credit Memo Tables
export const rbCreditMemo = pgTable('rb_credit_memo', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  customerId: text('customer_id').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('DRAFT'), // 'DRAFT','FINAL','APPLIED','VOID'
  presentCcy: text('present_ccy').notNull(),
  amount: numeric('amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const rbCreditApply = pgTable('rb_credit_apply', {
  id: text('id').primaryKey(),
  memoId: text('memo_id')
    .notNull()
    .references(() => rbCreditMemo.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => rbInvoice.id, { onDelete: 'cascade' }),
  amount: numeric('amount').notNull(),
});

// Billing Run Table
export const rbBillingRun = pgTable('rb_billing_run', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  presentCcy: text('present_ccy').notNull(),
  status: text('status').notNull().default('DRAFT'), // 'DRAFT','RATED','INVOICED','POSTED','ERROR'
  stats: jsonb('stats'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Invoice Artifacts Table
export const rbInvoiceArtifact = pgTable('rb_invoice_artifact', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => rbInvoice.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'PDF','CSV','JSON'
  filename: text('filename').notNull(),
  sha256: text('sha256').notNull(),
  bytes: integer('bytes').notNull(),
  storageUri: text('storage_uri').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// GL Bridge Table
export const rbPostLock = pgTable('rb_post_lock', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  invoiceId: text('invoice_id').notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Usage Source Table
export const rbUsageSource = pgTable('rb_usage_source', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(), // 'API','CSV','S3','KAFKA'
  config: jsonb('config').notNull(),
  active: boolean('active').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

// Invoice Email Table
export const rbInvoiceEmail = pgTable('rb_invoice_email', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => rbInvoice.id, { onDelete: 'cascade' }),
  toAddr: text('to_addr').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  status: text('status').notNull().default('queued'), // 'queued','sent','error'
  error: text('error'),
});

// --- Revenue Recognition Modifications (M25.2) ------------------------------------------------

// Change Order Header Table
export const revChangeOrder = pgTable('rev_change_order', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  contractId: text('contract_id')
    .notNull()
    .references(() => rbContract.id, { onDelete: 'cascade' }),
  effectiveDate: date('effective_date').notNull(),
  type: text('type').notNull(), // 'SEPARATE','TERMINATION_NEW','PROSPECTIVE','RETROSPECTIVE'
  reason: text('reason'),
  status: text('status').notNull().default('DRAFT'), // 'DRAFT','APPLIED','VOID'
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Change Order Line Items
export const revChangeLine = pgTable('rev_change_line', {
  id: text('id').primaryKey(),
  changeOrderId: text('change_order_id')
    .notNull()
    .references(() => revChangeOrder.id, { onDelete: 'cascade' }),
  pobId: text('pob_id'), // existing POB (modify) or NULL to add new
  productId: text('product_id').references(() => rbProduct.id), // for new POB
  qtyDelta: numeric('qty_delta'), // quantity change
  priceDelta: numeric('price_delta'), // price change
  termDeltaDays: integer('term_delta_days'), // term change in days
  newMethod: text('new_method'), // 'POINT_IN_TIME','RATABLE_DAILY','RATABLE_MONTHLY','USAGE'
  newSsp: numeric('new_ssp'), // new standalone selling price
});

// VC Policy per Company
export const revVcPolicy = pgTable('rev_vc_policy', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  defaultMethod: text('default_method').notNull(), // 'EXPECTED_VALUE','MOST_LIKELY'
  constraintProbabilityThreshold: numeric('constraint_probability_threshold')
    .notNull()
    .default('0.5'),
  volatilityLookbackMonths: integer('volatility_lookback_months')
    .notNull()
    .default(12),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

// VC Estimates by Contract/POB/Month
export const revVcEstimate = pgTable('rev_vc_estimate', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  contractId: text('contract_id')
    .notNull()
    .references(() => rbContract.id, { onDelete: 'cascade' }),
  pobId: text('pob_id').notNull(), // references future POB table
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  method: text('method').notNull(), // 'EXPECTED_VALUE','MOST_LIKELY'
  rawEstimate: numeric('raw_estimate').notNull(), // unconstrained estimate
  constrainedAmount: numeric('constrained_amount').notNull(), // after constraint applied
  confidence: numeric('confidence').notNull(), // 0-1
  status: text('status').notNull().default('OPEN'), // 'OPEN','RESOLVED'
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Transaction Price Revision
export const revTxnPriceRev = pgTable('rev_txn_price_rev', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  changeOrderId: text('change_order_id')
    .notNull()
    .references(() => revChangeOrder.id, { onDelete: 'cascade' }),
  previousTotalTp: numeric('previous_total_tp').notNull(), // total transaction price before
  newTotalTp: numeric('new_total_tp').notNull(), // total transaction price after
  allocatedDeltas: jsonb('allocated_deltas').notNull(), // per-POB allocation deltas
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Schedule Revision Tracking
export const revSchedRev = pgTable('rev_sched_rev', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  pobId: text('pob_id').notNull(), // references future POB table
  fromPeriodYear: integer('from_period_year').notNull(),
  fromPeriodMonth: integer('from_period_month').notNull(), // 1-12
  plannedBefore: numeric('planned_before').notNull(), // planned amount before revision
  plannedAfter: numeric('planned_after').notNull(), // planned amount after revision
  deltaPlanned: numeric('delta_planned').notNull(), // change in planned amount
  cause: text('cause').notNull(), // 'CO','VC_TRUEUP'
  changeOrderId: text('change_order_id').references(() => revChangeOrder.id),
  vcEstimateId: text('vc_estimate_id').references(() => revVcEstimate.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Revenue Recognition Catch-up
export const revRecCatchup = pgTable('rev_rec_catchup', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(), // references future rev_rec_run table
  pobId: text('pob_id').notNull(), // references future POB table
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  catchupAmount: numeric('catchup_amount').notNull(), // positive or negative catch-up
  drAccount: text('dr_account').notNull(), // debit account
  crAccount: text('cr_account').notNull(), // credit account
  memo: text('memo'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// Modification Register for audit/reporting
export const revModRegister = pgTable('rev_mod_register', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  contractId: text('contract_id')
    .notNull()
    .references(() => rbContract.id, { onDelete: 'cascade' }),
  changeOrderId: text('change_order_id')
    .notNull()
    .references(() => revChangeOrder.id, { onDelete: 'cascade' }),
  effectiveDate: date('effective_date').notNull(),
  type: text('type').notNull(),
  reason: text('reason'),
  txnPriceBefore: numeric('txn_price_before').notNull(),
  txnPriceAfter: numeric('txn_price_after').notNull(),
  txnPriceDelta: numeric('txn_price_delta').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// VC Rollforward for period summaries
export const revVcRollforward = pgTable('rev_vc_rollforward', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  contractId: text('contract_id')
    .notNull()
    .references(() => rbContract.id, { onDelete: 'cascade' }),
  pobId: text('pob_id').notNull(), // references future POB table
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  openingBalance: numeric('opening_balance').notNull().default('0'), // VC balance at start of period
  additions: numeric('additions').notNull().default('0'), // new VC estimates
  changes: numeric('changes').notNull().default('0'), // changes to existing estimates
  releases: numeric('releases').notNull().default('0'), // VC resolved and recognized
  recognized: numeric('recognized').notNull().default('0'), // VC recognized in revenue
  closingBalance: numeric('closing_balance').notNull().default('0'), // VC balance at end of period
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

// RPO Snapshot moved to revenue.ts (M25.1)
