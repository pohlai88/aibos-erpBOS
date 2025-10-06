// M16.1: Intangibles & Amortization Schema
// Drizzle ORM schema for intangible plans, amortization schedules, and posting maps

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

export const intangiblePlan = pgTable('intangible_plan', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  class: text('class').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  currency: text('currency').notNull(),
  presentCcy: text('present_ccy').notNull(),
  inService: date('in_service').notNull(),
  lifeM: integer('life_m').notNull(),
  costCenter: text('cost_center'),
  project: text('project'),
  sourceHash: text('source_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const amortSchedule = pgTable('amort_schedule', {
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

export const intangiblePostingMap = pgTable(
  'intangible_posting_map',
  {
    companyId: text('company_id').notNull(),
    class: text('class').notNull(),
    amortExpenseAccount: text('amort_expense_account').notNull(),
    accumAmortAccount: text('accum_amort_account').notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.companyId, t.class] }),
  })
);
