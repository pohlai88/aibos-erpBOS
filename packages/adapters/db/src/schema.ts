import { pgTable, text, char, timestamp, numeric, pgEnum, primaryKey, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const company = pgTable("company", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),            // Asset/Liability/Equity/Income/Expense
    normalBalance: char("normal_balance", { length: 1 }).notNull(), // D/C
    parentCode: text("parent_code"),
    // Dimension policies (M14)
    requireCostCenter: text("require_cost_center").notNull().default("false"),
    requireProject: text("require_project").notNull().default("false"),
});

export const accountingPeriod = pgTable("accounting_period", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
}, (t) => ({
    uniq: primaryKey({ columns: [t.id] })
}));

export const journal = pgTable("journal", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    postingDate: timestamp("posting_date", { withTimezone: true }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    sourceDoctype: text("source_doctype").notNull(),
    sourceId: text("source_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    isReversal: text("is_reversal").default("false").notNull(),
    reversesJournalId: text("reverses_journal_id"),
    autoReverseOn: timestamp("auto_reverse_on", { withTimezone: true }),
    // Multi-currency fields
    baseCurrency: char("base_currency", { length: 3 }),
    rateUsed: numeric("rate_used", { precision: 20, scale: 10 })
});

export const journalLine = pgTable("journal_line", {
    id: text("id").primaryKey(),
    journalId: text("journal_id").references(() => journal.id, { onDelete: "cascade" }).notNull(),
    accountCode: text("account_code").notNull(),
    dc: char("dc", { length: 1 }).notNull(),
    amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    partyType: text("party_type"),
    partyId: text("party_id"),
    // Multi-currency fields
    baseAmount: numeric("base_amount", { precision: 20, scale: 6 }),
    baseCurrency: char("base_currency", { length: 3 }),
    txnAmount: numeric("txn_amount", { precision: 20, scale: 6 }),
    txnCurrency: char("txn_currency", { length: 3 }),
    // Dimensions (M14)
    costCenterId: text("cost_center_id").references(() => dimCostCenter.id),
    projectId: text("project_id").references(() => dimProject.id)
});

export const fxRate = pgTable("fx_rate", {
    id: text("id").primaryKey(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    fromCcy: char("from_ccy", { length: 3 }).notNull(),
    toCcy: char("to_ccy", { length: 3 }).notNull(),
    rate: numeric("rate", { precision: 20, scale: 10 }).notNull(),
    source: text("source").default("manual").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const outbox = pgTable("outbox", {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    payload: text("payload").notNull(), // JSON string
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const item = pgTable("item", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    uom: text("uom").notNull()
});

export const stockLedger = pgTable("stock_ledger", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    itemId: text("item_id").references(() => item.id).notNull(),
    moveId: text("move_id").notNull(),     // idempotency key for the move
    kind: text("kind").notNull(),          // 'in' | 'out'
    qty: numeric("qty", { precision: 20, scale: 6 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 20, scale: 6 }).notNull(),  // MYR per unit
    totalCost: numeric("total_cost", { precision: 20, scale: 6 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const itemCosts = pgTable("item_costs", {
    companyId: text("company_id").references(() => company.id).notNull(),
    itemId: text("item_id").references(() => item.id).notNull(),
    onHandQty: numeric("on_hand_qty", { precision: 20, scale: 6 }).notNull(),
    movingAvgCost: numeric("moving_avg_cost", { precision: 20, scale: 6 }).notNull(),
    totalValue: numeric("total_value", { precision: 20, scale: 6 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, t => ({
    pk: primaryKey({ columns: [t.companyId, t.itemId] })
}));

export const payment = pgTable("payment", {
    id: text("id").primaryKey(),                // payment id (idempotency)
    companyId: text("company_id").references(() => company.id).notNull(),
    kind: text("kind").notNull(),               // 'AR' | 'AP'
    partyType: text("party_type").notNull(),    // 'Customer' | 'Supplier'
    partyId: text("party_id").notNull(),
    docDate: timestamp("doc_date", { withTimezone: true }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    journalId: text("journal_id")               // populated once posted
});

export const paymentAllocation = pgTable("payment_allocation", {
    id: text("id").primaryKey(),
    paymentId: text("payment_id").references(() => payment.id, { onDelete: "cascade" }).notNull(),
    applyDoctype: text("apply_doctype").notNull(), // 'SalesInvoice' | 'PurchaseInvoice'
    applyId: text("apply_id").notNull(),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull()
});

// --- Auth & Multi-Company --------------------------------------------------
export const appUser = pgTable("app_user", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const membership = pgTable("membership", {
    userId: text("user_id").references(() => appUser.id).notNull(),
    companyId: text("company_id").references(() => company.id).notNull(),
    role: text("role").notNull().default("admin") // 'admin' | 'member'
}, t => ({
    pk: primaryKey({ columns: [t.userId, t.companyId] })
}));

export const apiKey = pgTable("api_key", {
    id: text("id").primaryKey(),              // public id (prefix 'ak_...')
    userId: text("user_id").references(() => appUser.id).notNull(),
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    hash: text("hash").notNull(),             // SHA256 of secret
    enabled: text("enabled").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// --- Dimensions & Cost Centers (M14) -----------------------------------------
export const dimCostCenter = pgTable("dim_cost_center", {
    id: text("id").primaryKey(),              // e.g. "CC-OPS"
    name: text("name").notNull(),
    parentId: text("parent_id"), // optional hierarchy - will add reference after table creation
    active: text("active").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const dimProject = pgTable("dim_project", {
    id: text("id").primaryKey(),              // e.g. "PRJ-ALPHA"
    name: text("name").notNull(),
    active: text("active").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// --- Budgets & Variance (M14.1) -------------------------------------------
export const budget = pgTable("budget", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    currency: text("currency").notNull(),
    locked: text("locked").notNull().default("false"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const budgetLine = pgTable("budget_line", {
    id: text("id").primaryKey(),
    budgetId: text("budget_id").references(() => budget.id, { onDelete: "cascade" }).notNull(),
    companyId: text("company_id").references(() => company.id).notNull(),
    periodMonth: char("period_month", { length: 7 }).notNull(), // e.g. '2025-11'
    accountCode: text("account_code").notNull(),
    costCenterId: text("cost_center_id").references(() => dimCostCenter.id),
    projectId: text("project_id").references(() => dimProject.id),
    amountBase: numeric("amount_base", { precision: 20, scale: 6 }).notNull(),
    importId: text("import_id"), // M14.3: Link to budget_import for audit trail
    versionId: text("version_id"), // M14.4: Link to budget_version
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// --- Budget Import (M14.3) -----------------------------------------------
export const budgetImport = pgTable("budget_import", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").notNull(),
    sourceName: text("source_name").notNull(),
    sourceHash: text("source_hash").notNull(),
    mappingJson: jsonb("mapping_json").notNull(),
    delimiter: text("delimiter").notNull().default(","),
    rowsTotal: integer("rows_total").notNull().default(0),
    rowsValid: integer("rows_valid").notNull().default(0),
    rowsInvalid: integer("rows_invalid").notNull().default(0),
    status: text("status").notNull().default("pending"), // pending|dry_run_ok|committed|failed
    errorReport: jsonb("error_report"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdByKey: text("created_by_key").notNull(),
});

// --- Budget Versions & Approvals (M14.4) ----------------------------------
export const budgetVersion = pgTable("budget_version", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(), // e.g. "FY25-BL", "FY25-WIP", "FY25-V2"
    label: text("label").notNull(),
    year: integer("year").notNull(),
    isBaseline: boolean("is_baseline").notNull().default(false),
    status: text("status").notNull().default("draft"), // draft|submitted|approved|returned|archived
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const budgetApproval = pgTable("budget_approval", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    versionId: text("version_id").references(() => budgetVersion.id, { onDelete: "cascade" }).notNull(),
    action: text("action").notNull(), // submit|approve|return
    actor: text("actor").notNull(), // user id / api key id
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const budgetAlertRule = pgTable("budget_alert_rule", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    accountCode: text("account_code"), // null = all accounts
    costCenter: text("cost_center"), // null = all cost centers
    project: text("project"), // null = all projects
    periodScope: text("period_scope").notNull(), // month|qtr|ytd
    thresholdPct: numeric("threshold_pct", { precision: 5, scale: 2 }).notNull(), // e.g. 10 = 10%
    comparator: text("comparator").notNull(), // gt|lt|gte|lte|abs_gt|abs_gte
    delivery: jsonb("delivery").notNull(), // { "email":["..."], "webhook":"https://..." }
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

// --- Driver-Based Rolling Forecast (M14.5) -----------------------------------
export const driverProfile = pgTable("driver_profile", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    formulaJson: jsonb("formula_json").notNull(), // { "revenue": "price * volume", "cogs": "revenue * 0.6" }
    seasonalityJson: jsonb("seasonality_json").notNull(), // [100, 95, 110, ...] - 12 months normalized to 100%
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const forecastVersion = pgTable("forecast_version", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(), // e.g. "FY25-FC1", "FY25-Q2-FC"
    label: text("label").notNull(),
    year: integer("year").notNull(),
    driverProfileId: text("driver_profile_id").references(() => driverProfile.id),
    status: text("status").notNull().default("draft"), // draft|submitted|approved|returned|archived
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const forecastLine = pgTable("forecast_line", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    versionId: text("version_id").references(() => forecastVersion.id, { onDelete: "cascade" }).notNull(),
    accountCode: text("account_code").notNull(),
    costCenterCode: text("cost_center_code"),
    projectCode: text("project_code"),
    month: integer("month").notNull(), // 1-12
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Working Capital & Cash Flow Forecast (M15) ------------------------------
export const wcProfile = pgTable("wc_profile", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    dsoDays: numeric("dso_days").notNull(), // Days Sales Outstanding
    dpoDays: numeric("dpo_days").notNull(), // Days Payables Outstanding
    dioDays: numeric("dio_days").notNull(), // Days Inventory Outstanding
    taxRatePct: numeric("tax_rate_pct").notNull().default("24"), // e.g., 24 = 24%
    interestApr: numeric("interest_apr").notNull().default("6"), // annual %
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const cashForecastVersion = pgTable("cash_forecast_version", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(), // e.g., CFY25-01
    label: text("label").notNull(),
    year: integer("year").notNull(),
    status: text("status").notNull().default("draft"), // draft|submitted|approved|returned|archived
    profileId: text("profile_id").references(() => wcProfile.id), // fk to wc_profile.id (soft)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const cashLine = pgTable("cash_line", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    versionId: text("version_id").references(() => cashForecastVersion.id, { onDelete: "cascade" }).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1..12
    currency: text("currency").notNull(), // source currency
    presentCcy: text("present_ccy").notNull(), // presentation currency (post-conversion)
    cashIn: numeric("cash_in").notNull().default("0"),
    cashOut: numeric("cash_out").notNull().default("0"),
    netChange: numeric("net_change").notNull().default("0"),
    costCenter: text("cost_center"), // denormalized code (optional)
    project: text("project"), // denormalized code (optional)
    sourceHash: text("source_hash").notNull(), // idempotency for generation
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});