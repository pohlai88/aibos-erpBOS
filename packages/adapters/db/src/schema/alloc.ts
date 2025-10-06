import {
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const allocRule = pgTable('alloc_rule', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  method: text('method').notNull(), // 'PERCENT' | 'RATE_PER_UNIT' | 'DRIVER_SHARE'
  driverCode: text('driver_code'),
  ratePerUnit: numeric('rate_per_unit'),
  srcAccount: text('src_account'),
  srcCcLike: text('src_cc_like'),
  srcProject: text('src_project'),
  effFrom: date('eff_from'),
  effTo: date('eff_to'),
  orderNo: integer('order_no').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').notNull(),
});

export const allocRuleTarget = pgTable(
  'alloc_rule_target',
  {
    ruleId: text('rule_id').notNull(),
    targetCc: text('target_cc').notNull(),
    percent: numeric('percent').notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.ruleId, table.targetCc] }),
  })
);

export const allocDriverValue = pgTable(
  'alloc_driver_value',
  {
    companyId: text('company_id').notNull(),
    driverCode: text('driver_code').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    costCenter: text('cost_center'),
    project: text('project'),
    value: numeric('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: text('updated_by').notNull(),
  },
  table => ({
    pk: primaryKey({
      columns: [
        table.companyId,
        table.driverCode,
        table.year,
        table.month,
        table.costCenter ?? '',
        table.project ?? '',
      ],
    }),
  })
);

export const allocRun = pgTable('alloc_run', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  mode: text('mode').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const allocLine = pgTable('alloc_line', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  ruleId: text('rule_id').notNull(),
  srcAccount: text('src_account'),
  srcCc: text('src_cc'),
  targetCc: text('target_cc').notNull(),
  amountBase: numeric('amount_base').notNull(),
  driverCode: text('driver_code'),
  driverValue: numeric('driver_value'),
  method: text('method').notNull(),
  note: text('note'),
});

export const allocLock = pgTable(
  'alloc_lock',
  {
    companyId: text('company_id').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    ruleId: text('rule_id').notNull(),
  },
  table => ({
    pk: primaryKey({
      columns: [table.companyId, table.year, table.month, table.ruleId],
    }),
  })
);

export const allocAccountMap = pgTable(
  'alloc_account_map',
  {
    companyId: text('company_id').notNull(),
    srcAccount: text('src_account').notNull(),
    targetAccount: text('target_account').notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.companyId, table.srcAccount] }),
  })
);

export const allocImportAudit = pgTable('alloc_import_audit', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  kind: text('kind').notNull(),
  filename: text('filename'),
  rowsOk: integer('rows_ok').notNull(),
  rowsErr: integer('rows_err').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text('created_by').notNull(),
});
