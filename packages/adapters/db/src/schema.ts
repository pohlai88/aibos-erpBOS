import { pgTable, text, char, timestamp, numeric, pgEnum as _pgEnum, primaryKey, integer, boolean, jsonb, date } from "drizzle-orm/pg-core";
import { relations as _relations } from "drizzle-orm";

// Import allocation schemas
export * from "./schema/alloc.js";
export * from "./schema/tax_return.js";
export * from "./schema/consol.js";
export * from "./schema/payments.js";
export * from "./schema/ar.js";
export * from "./schema/rb.js";
export * from "./schema/revenue.js";
export * from "./schema/close.js";
export * from "./schema/controls.js";
export * from "./schema/insights.js";
export * from "./schema/evidence.js";
export * from "./schema/sox.js";
export * from "./schema/close-board.js";
export * from "./schema/opscc.js";
export * from "./schema/attest.js";
export * from "./schema/audit.js";
export * from "./schema/itgc.js";
export * from "./schema/lease.js";

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
    // Account class for consolidation policy (M21.1)
    class: text("class"),                     // ASSET/LIAB/EQUITY/REVENUE/EXPENSE
});

export const accountingPeriod = pgTable("accounting_period", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
});

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
    code: text("code").notNull(),             // path segment for ltree
    name: text("name").notNull(),
    parentId: text("parent_id"), // optional hierarchy - will add reference after table creation
    path: text("path"),                       // ltree path for rollups
    active: text("active").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const dimProject = pgTable("dim_project", {
    id: text("id").primaryKey(),              // e.g. "PRJ-ALPHA"
    name: text("name").notNull(),
    active: text("active").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// --- Periods & Policy Enforcement (M17) -------------------------------------
export const periods = pgTable("periods", {
    companyId: text("company_id").references(() => company.id).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    state: text("state").notNull(), // 'open', 'pending_close', 'closed'
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.year, table.month] })
}));

// --- FX Admin Rates (M17) ---------------------------------------------------
export const fxAdminRates = pgTable("fx_admin_rates", {
    companyId: text("company_id").references(() => company.id).notNull(),
    asOfDate: date("as_of_date").notNull(),
    srcCcy: text("src_ccy").notNull(),
    dstCcy: text("dst_ccy").notNull(),
    rate: numeric("rate").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.asOfDate, table.srcCcy, table.dstCcy] })
}));

// --- Journal Entries & Lines (M17) -----------------------------------------
export const journalEntries = pgTable("journal_entries", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    date: date("date").notNull(),
    memo: text("memo"),
    tags: jsonb("tags"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: text("created_by").notNull()
});

export const journalLines = pgTable("journal_lines", {
    id: text("id").primaryKey(),
    journalId: text("journal_id").references(() => journalEntries.id).notNull(),
    accountId: text("account_id").references(() => account.id).notNull(),
    debit: numeric("debit", { precision: 15, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 15, scale: 2 }).notNull().default("0"),
    description: text("description")
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

// --- Cash/Liquidity Alerts (M15.1) -------------------------------------------
export const cashAlertRule = pgTable("cash_alert_rule", {
    id: text("id").primaryKey(), // ULID
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),            // "min_cash" | "max_burn" | "runway_months"
    thresholdNum: numeric("threshold_num").notNull(),
    filterCc: text("filter_cc"),
    filterProject: text("filter_project"),
    delivery: jsonb("delivery").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

// --- Per-Company Cash Alert Schedule (M15.2) -------------------------------------
export const cashAlertSchedule = pgTable("cash_alert_schedule", {
    companyId: text("company_id").primaryKey(),
    enabled: boolean("enabled").notNull().default(true),
    hourLocal: integer("hour_local").notNull().default(8),
    minuteLocal: integer("minute_local").notNull().default(0),
    timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
    scenarioCode: text("scenario_code").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

// --- Capex & Depreciation (M16) ------------------------------------------------
export const assetClassRef = pgTable("asset_class_ref", {
    code: text("code").primaryKey(),
    label: text("label").notNull(),
    method: text("method").notNull(),          // SL | DDB
    defaultLifeM: integer("default_life_m").notNull(),
    residualPct: numeric("residual_pct").notNull().default("0"),
});

export const capexPlan = pgTable("capex_plan", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    assetClass: text("asset_class").notNull(),
    description: text("description").notNull(),
    capexAmount: numeric("capex_amount").notNull(),
    currency: text("currency").notNull(),
    presentCcy: text("present_ccy").notNull(),
    inService: date("in_service").notNull(),
    lifeM: integer("life_m"),
    method: text("method"),
    costCenter: text("cost_center"),
    project: text("project"),
    sourceHash: text("source_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const deprSchedule = pgTable("depr_schedule", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    planId: text("plan_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    currency: text("currency").notNull(),
    presentCcy: text("present_ccy").notNull(),
    amount: numeric("amount").notNull(),
    bookedFlag: boolean("booked_flag").notNull().default(false),
    bookedJournalId: text("booked_journal_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assetPostingMap = pgTable("asset_posting_map", {
    companyId: text("company_id").notNull(),
    assetClass: text("asset_class").notNull(),
    deprExpenseAccount: text("depr_expense_account").notNull(),
    accumDeprAccount: text("accum_depr_account").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.assetClass] })
}));

// --- Intangibles & Amortization (M16.1) -----------------------------------------
export const intangiblePlan = pgTable("intangible_plan", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    class: text("class").notNull(),
    description: text("description").notNull(),
    amount: numeric("amount").notNull(),
    currency: text("currency").notNull(),
    presentCcy: text("present_ccy").notNull(),
    inService: date("in_service").notNull(),
    lifeM: integer("life_m").notNull(),
    costCenter: text("cost_center"),
    project: text("project"),
    sourceHash: text("source_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const amortSchedule = pgTable("amort_schedule", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    planId: text("plan_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    currency: text("currency").notNull(),
    presentCcy: text("present_ccy").notNull(),
    amount: numeric("amount").notNull(),
    bookedFlag: boolean("booked_flag").notNull().default(false),
    bookedJournalId: text("booked_journal_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const intangiblePostingMap = pgTable("intangible_posting_map", {
    companyId: text("company_id").notNull(),
    class: text("class").notNull(),
    amortExpenseAccount: text("amort_expense_account").notNull(),
    accumAmortAccount: text("accum_amort_account").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.class] })
}));

// --- M16.3/M16.4: Assets Configuration & Advanced Features ---------------------
export const assetsConfig = pgTable("assets_config", {
    companyId: text("company_id").primaryKey(),
    prorationEnabled: boolean("proration_enabled").notNull().default(false),
    prorationBasis: text("proration_basis").notNull().default("days_in_month"),
    fxPresentationPolicy: text("fx_presentation_policy").notNull().default("post_month"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assetImpairment = pgTable("asset_impairment", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    planKind: text("plan_kind").notNull(),  // 'capex'|'intangible'
    planId: text("plan_id").notNull(),
    date: date("date").notNull(),
    amount: numeric("amount").notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const fxSnapshot = pgTable("fx_snapshot", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    planKind: text("plan_kind").notNull(),
    planId: text("plan_id").notNull(),
    policy: text("policy").notNull(),
    year: integer("year"),
    month: integer("month"),
    rate: numeric("rate").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assetsLimits = pgTable("assets_limits", {
    companyId: text("company_id").primaryKey(),
    importMaxRows: integer("import_max_rows").notNull().default(10000),
    bulkPostMaxRows: integer("bulk_post_max_rows").notNull().default(5000),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assetsUiDraft = pgTable("assets_ui_draft", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    kind: text("kind").notNull(),          // 'depr'|'amort'
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    payload: jsonb("payload").notNull(),   // dry-run summary blob
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// --- FX Revaluation (M18) ---------------------------------------------------
export const fxRevalRun = pgTable("fx_reval_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    mode: text("mode").notNull(), // 'dry_run' | 'commit'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const fxRevalLine = pgTable("fx_reval_line", {
    id: text("id").primaryKey(),
    runId: text("run_id").references(() => fxRevalRun.id).notNull(),
    glAccount: text("gl_account").notNull(),
    currency: text("currency").notNull(),
    balanceBase: numeric("balance_base").notNull(),
    balanceSrc: numeric("balance_src").notNull(),
    rateOld: numeric("rate_old").notNull(),
    rateNew: numeric("rate_new").notNull(),
    deltaBase: numeric("delta_base").notNull(),
});

export const fxRevalLock = pgTable("fx_reval_lock", {
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    glAccount: text("gl_account").notNull(),
    currency: text("currency").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.year, table.month, table.glAccount, table.currency] })
}));

export const fxAccountMap = pgTable("fx_account_map", {
    companyId: text("company_id").notNull(),
    glAccount: text("gl_account").notNull(),
    unrealGainAccount: text("unreal_gain_account").notNull(),
    unrealLossAccount: text("unreal_loss_account").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.glAccount] })
}));

// --- Allocations & Shared-Services Recharges (M19) -------------------------
// Imported from ./schema/alloc.ts