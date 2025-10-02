import { pgTable, text, integer, numeric, boolean, timestamp, date, primaryKey } from "drizzle-orm/pg-core";

// --- Cash Flow Engine (M22) --------------------------------------------------
export const cfMap = pgTable("cf_map", {
    companyId: text("company_id").notNull(),
    mapCode: text("map_code").notNull(),
    accountLike: text("account_like").notNull(),
    cfSection: text("cf_section").notNull(),
    sign: text("sign").notNull(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.mapCode, table.accountLike] })
}));

export const cfScenario = pgTable("cf_scenario", {
    companyId: text("company_id").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.code] })
}));

export const cfDriverWeek = pgTable("cf_driver_week", {
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    isoWeek: integer("iso_week").notNull(),
    driverCode: text("driver_code").notNull(),
    costCenter: text("cost_center"),
    project: text("project"),
    amount: numeric("amount").notNull(),
    scenario: text("scenario").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const cfAdjustWeek = pgTable("cf_adjust_week", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    isoWeek: integer("iso_week").notNull(),
    bucket: text("bucket").notNull(),
    memo: text("memo"),
    amount: numeric("amount").notNull(),
    scenario: text("scenario").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const bankAccount = pgTable("bank_account", {
    companyId: text("company_id").notNull(),
    acctCode: text("acct_code").notNull(),
    name: text("name").notNull(),
    ccy: text("ccy").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.acctCode] })
}));

export const bankBalanceDay = pgTable("bank_balance_day", {
    companyId: text("company_id").notNull(),
    acctCode: text("acct_code").notNull(),
    asOfDate: date("as_of_date").notNull(),
    balance: numeric("balance").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.acctCode, table.asOfDate] })
}));

export const bankTxnImport = pgTable("bank_txn_import", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    acctCode: text("acct_code").notNull(),
    txnDate: date("txn_date").notNull(),
    amount: numeric("amount").notNull(),
    memo: text("memo"),
    source: text("source"),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
    uniqHash: text("uniq_hash").notNull(),
});

export const cfRun = pgTable("cf_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    scope: text("scope").notNull(),
    year: integer("year").notNull(),
    month: integer("month"),
    startDate: date("start_date"),
    mode: text("mode").notNull(),
    presentCcy: text("present_ccy"),
    scenario: text("scenario"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const cfLine = pgTable("cf_line", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    label: text("label").notNull(),
    period: text("period").notNull(),
    amount: numeric("amount").notNull(),
    note: text("note"),
});

export const cfLock = pgTable("cf_lock", {
    companyId: text("company_id").notNull(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.scope, table.key] })
}));

export const cfImportAudit = pgTable("cf_import_audit", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    kind: text("kind").notNull(),
    filename: text("filename"),
    rowsOk: integer("rows_ok").notNull(),
    rowsErr: integer("rows_err").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});
