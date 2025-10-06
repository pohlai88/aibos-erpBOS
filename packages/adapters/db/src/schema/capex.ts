// M16: Capex & Depreciation Schema
// Drizzle ORM schema for asset classes, capex plans, depreciation schedules, and posting maps

import {
  pgTable,
  text,
  integer,
  timestamp,
  numeric,
  boolean,
  date,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const assetClassRef = pgTable('asset_class_ref', {
  code: text('code').primaryKey(),
  label: text('label').notNull(),
  method: text('method').notNull(), // SL | DDB
  defaultLifeM: integer('default_life_m').notNull(),
  residualPct: numeric('residual_pct').notNull().default('0'),
});

export const capexPlan = pgTable('capex_plan', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  assetClass: text('asset_class').notNull(),
  description: text('description').notNull(),
  capexAmount: numeric('capex_amount').notNull(),
  currency: text('currency').notNull(),
  presentCcy: text('present_ccy').notNull(),
  inService: date('in_service').notNull(),
  lifeM: integer('life_m'),
  method: text('method'),
  costCenter: text('cost_center'),
  project: text('project'),
  sourceHash: text('source_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const deprSchedule = pgTable('depr_schedule', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  planId: text('plan_id').notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  currency: text('currency').notNull(),
  presentCcy: text('present_ccy').notNull(),
  amount: numeric('amount').notNull(),
  bookedFlag: boolean('booked_flag').notNull().default(false),
  bookedJournalId: text('booked_journal_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assetPostingMap = pgTable(
  'asset_posting_map',
  {
    companyId: text('company_id').notNull(),
    assetClass: text('asset_class').notNull(),
    deprExpenseAccount: text('depr_expense_account').notNull(),
    accumDeprAccount: text('accum_depr_account').notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.companyId, t.assetClass] }),
  })
);
