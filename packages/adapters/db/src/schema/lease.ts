import { pgTable, text, timestamp, numeric, integer, boolean, jsonb, date, unique, index } from "drizzle-orm/pg-core";

// Lease Accounting Core Tables (M28 - MFRS 16)

export const lease = pgTable("lease", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseCode: text("lease_code").notNull().unique(),
    lessor: text("lessor").notNull(),
    assetClass: text("asset_class").notNull(), // Land/Building, IT/Equipment, Vehicles, Others
    ccy: text("ccy").notNull(), // 3-char currency code
    commenceOn: date("commence_on").notNull(),
    endOn: date("end_on").notNull(),
    paymentFrequency: text("payment_frequency").notNull(), // MONTHLY, QUARTERLY, ANNUALLY
    discountRate: numeric("discount_rate").notNull(),
    rateKind: text("rate_kind").notNull().default("fixed"), // fixed, floating
    indexCode: text("index_code"), // CPI index for floating rates
    shortTermExempt: boolean("short_term_exempt").notNull().default(false),
    lowValueExempt: boolean("low_value_exempt").notNull().default(false),
    presentCcy: text("present_ccy"), // presentation currency (M17)
    status: text("status").notNull().default("DRAFT"), // DRAFT, ACTIVE, TERMINATED, EXPIRED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyCodeIdx: index("idx_lease_company_code").on(table.companyId, table.leaseCode),
    companyClassStatusIdx: index("idx_lease_company_class_status").on(table.companyId, table.assetClass, table.status),
    companyCommenceIdx: index("idx_lease_company_commence").on(table.companyId, table.commenceOn)
}));

export const leaseCashflow = pgTable("lease_cashflow", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    dueOn: date("due_on").notNull(),
    amount: numeric("amount").notNull(),
    inSubstanceFixed: boolean("in_substance_fixed").notNull().default(true),
    variableFlag: boolean("variable_flag").notNull().default(false),
    indexBase: numeric("index_base"), // base index rate for variable payments
    indexLinkId: text("index_link_id"), // reference to index rate changes
    paidFlag: boolean("paid_flag").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    leaseDueIdx: index("idx_lease_cashflow_lease_due").on(table.leaseId, table.dueOn)
}));

export const leaseOpening = pgTable("lease_opening", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    initialLiability: numeric("initial_liability").notNull(),
    initialRou: numeric("initial_rou").notNull(),
    incentivesReceived: numeric("incentives_received").notNull().default("0"),
    initialDirectCosts: numeric("initial_direct_costs").notNull().default("0"),
    restorationCost: numeric("restoration_cost").notNull().default("0"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    computedBy: text("computed_by").notNull()
});

export const leaseSchedule = pgTable("lease_schedule", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    openLiab: numeric("open_liab").notNull(),
    interest: numeric("interest").notNull(),
    payment: numeric("payment").notNull(),
    fxReval: numeric("fx_reval").notNull().default("0"),
    closeLiab: numeric("close_liab").notNull(),
    rouAmort: numeric("rou_amort").notNull(),
    rouCarry: numeric("rou_carry").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueLeasePeriod: unique("lease_schedule_unique").on(table.leaseId, table.year, table.month),
    leasePeriodIdx: index("idx_lease_schedule_lease_period").on(table.leaseId, table.year, table.month),
    companyPeriodIdx: index("idx_lease_schedule_company_period").on(table.leaseId, table.year, table.month)
}));

export const leaseEvent = pgTable("lease_event", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // INDEX, RATE, TERM, SCOPE, TERMINATION
    effectiveOn: date("effective_on").notNull(),
    indexRate: numeric("index_rate"), // new index rate for CPI changes
    deltaTerm: integer("delta_term"), // change in lease term (months)
    deltaPay: numeric("delta_pay"), // change in payment amount
    scopeChangePct: numeric("scope_change_pct"), // percentage change in scope
    terminationFlag: boolean("termination_flag").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    leaseEffectiveIdx: index("idx_lease_event_lease_effective").on(table.leaseId, table.effectiveOn)
}));

export const leasePostLock = pgTable("lease_post_lock", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    status: text("status").notNull().default("LOCKED"), // LOCKED, POSTING, POSTED, ERROR
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: text("posted_by"),
    errorMsg: text("error_msg"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyPeriod: unique("lease_post_lock_unique").on(table.companyId, table.year, table.month),
    companyPeriodIdx: index("idx_lease_post_lock_company_period").on(table.companyId, table.year, table.month)
}));

export const leaseDisclosure = pgTable("lease_disclosure", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    maturityJsonb: jsonb("maturity_jsonb").notNull(), // maturity analysis by time bands
    rollforwardJsonb: jsonb("rollforward_jsonb").notNull(), // additions/remeasurements/terminations
    wadr: numeric("wadr").notNull(), // weighted average discount rate
    shortTermExpense: numeric("short_term_expense").notNull().default("0"),
    lowValueExpense: numeric("low_value_expense").notNull().default("0"),
    variableExpense: numeric("variable_expense").notNull().default("0"),
    totalCashOutflow: numeric("total_cash_outflow").notNull().default("0"),
    // M28.3: Extended fields for component and impairment disclosures
    impairmentCharges: numeric("impairment_charges").notNull().default("0"),
    impairmentReversals: numeric("impairment_reversals").notNull().default("0"),
    componentCarryingAmounts: jsonb("component_carrying_amounts"), // component roll-up by class
    restorationProvisionsMovement: jsonb("restoration_provisions_movement"), // restoration provisions roll-forward
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyPeriod: unique("lease_disclosure_unique").on(table.companyId, table.year, table.month),
    companyPeriodIdx: index("idx_lease_disclosure_company_period").on(table.companyId, table.year, table.month),
    maturityJsonbIdx: index("idx_lease_disclosure_maturity_jsonb").using("gin", table.maturityJsonb),
    rollforwardJsonbIdx: index("idx_lease_disclosure_rollforward_jsonb").using("gin", table.rollforwardJsonb)
}));

export const leaseAttachment = pgTable("lease_attachment", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    evidenceId: text("evidence_id").notNull(), // references M26.4 evidence vault
    attachmentType: text("attachment_type").notNull(), // AGREEMENT, CPI_NOTICE, IDC_SUPPORT, OTHER
    description: text("description"),
    uploadedBy: text("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    leaseTypeIdx: index("idx_lease_attachment_lease_type").on(table.leaseId, table.attachmentType)
}));

// M28.1: Remeasurements, Indexation & Month-End Posting Tables

export const leaseCpiIndex = pgTable("lease_cpi_index", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    indexCode: text("index_code").notNull(),
    indexDate: date("index_date").notNull(),
    indexValue: numeric("index_value").notNull(),
    lagMonths: integer("lag_months").notNull().default(0), // T-N months lag policy
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyCodeDate: unique("lease_cpi_index_unique").on(table.companyId, table.indexCode, table.indexDate),
    companyCodeDateIdx: index("idx_lease_cpi_index_company_code_date").on(table.companyId, table.indexCode, table.indexDate),
    codeDateIdx: index("idx_lease_cpi_index_code_date").on(table.indexCode, table.indexDate)
}));

export const leaseRemeasureArtifact = pgTable("lease_remeasure_artifact", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    eventId: text("event_id").notNull().references(() => leaseEvent.id, { onDelete: "cascade" }),
    artifactType: text("artifact_type").notNull(), // INDEX, RATE, TERM, SCOPE, TERMINATION
    inputsJsonb: jsonb("inputs_jsonb").notNull(), // input parameters for calculation
    calculationsJsonb: jsonb("calculations_jsonb").notNull(), // step-by-step calculations
    outputsJsonb: jsonb("outputs_jsonb").notNull(), // final results
    checksum: text("checksum").notNull(), // SHA-256 hash for integrity
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    computedBy: text("computed_by").notNull()
}, (table) => ({
    eventIdx: index("idx_lease_remeasure_artifact_event").on(table.eventId),
    leaseIdx: index("idx_lease_remeasure_artifact_lease").on(table.leaseId),
    inputsJsonbIdx: index("idx_lease_remeasure_artifact_inputs_jsonb").using("gin", table.inputsJsonb),
    calculationsJsonbIdx: index("idx_lease_remeasure_artifact_calculations_jsonb").using("gin", table.calculationsJsonb),
    outputsJsonbIdx: index("idx_lease_remeasure_artifact_outputs_jsonb").using("gin", table.outputsJsonb)
}));

// M28.3: Componentized ROU & Impairment Tables

export const leaseComponent = pgTable("lease_component", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    class: text("class").notNull(), // Land, Building, Fit-out, IT/Equipment, Vehicles, Others
    uom: text("uom"), // unit of measure
    pctOfRou: numeric("pct_of_rou").notNull(),
    usefulLifeMonths: integer("useful_life_months").notNull(),
    method: text("method").notNull().default("SL"), // SL, DDB, Units
    unitsBasis: numeric("units_basis"), // for units-based depreciation
    incentiveAlloc: numeric("incentive_alloc").notNull().default("0"),
    restorationAlloc: numeric("restoration_alloc").notNull().default("0"),
    startOn: date("start_on").notNull(),
    endOn: date("end_on").notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE, CLOSED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    uniqueLeaseCode: unique("lease_component_unique").on(table.leaseId, table.code),
    companyLeaseIdx: index("idx_lease_component_company_lease").on(table.companyId, table.leaseId),
    companyClassIdx: index("idx_lease_component_company_class").on(table.companyId, table.class),
    leaseCodeIdx: index("idx_lease_component_lease_code").on(table.leaseId, table.code)
}));

export const leaseComponentSched = pgTable("lease_component_sched", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    openCarry: numeric("open_carry").notNull(),
    rouAmort: numeric("rou_amort").notNull(),
    interest: numeric("interest").notNull().default("0"),
    closeCarry: numeric("close_carry").notNull(),
    liabInterest: numeric("liab_interest").notNull().default("0"),
    liabReduction: numeric("liab_reduction").notNull().default("0"),
    idx: jsonb("idx"), // additional calculation metadata
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyComponentPeriod: unique("lease_component_sched_unique").on(table.companyId, table.leaseComponentId, table.year, table.month),
    componentPeriodIdx: index("idx_lease_component_sched_component_period").on(table.leaseComponentId, table.year, table.month),
    companyPeriodIdx: index("idx_lease_component_sched_company_period").on(table.companyId, table.year, table.month)
}));

export const leaseComponentLink = pgTable("lease_component_link", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    linkType: text("link_type").notNull(), // FA_CLASS, COST_CENTER, PROJECT, OTHER
    linkValue: text("link_value").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    uniqueComponentTypeValue: unique("lease_component_link_unique").on(table.leaseComponentId, table.linkType, table.linkValue),
    componentIdx: index("idx_lease_component_link_component").on(table.leaseComponentId),
    companyTypeIdx: index("idx_lease_component_link_company_type").on(table.companyId, table.linkType),
    valueIdx: index("idx_lease_component_link_value").on(table.linkType, table.linkValue)
}));

export const leaseImpairTest = pgTable("lease_impair_test", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    cguCode: text("cgu_code").notNull(), // cash generating unit code
    level: text("level").notNull(), // COMPONENT, CGU
    method: text("method").notNull(), // VIU, FVLCD
    discountRate: numeric("discount_rate").notNull(),
    recoverableAmount: numeric("recoverable_amount").notNull(),
    trigger: text("trigger").notNull(), // INDICATOR, ANNUAL, EVENT
    asOfDate: date("as_of_date").notNull(),
    status: text("status").notNull().default("DRAFT"), // DRAFT, MEASURED, POSTED
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyCguIdx: index("idx_lease_impair_test_company_cgu").on(table.companyId, table.cguCode),
    companyDateIdx: index("idx_lease_impair_test_company_date").on(table.companyId, table.asOfDate),
    statusIdx: index("idx_lease_impair_test_status").on(table.status)
}));

export const leaseImpairLine = pgTable("lease_impair_line", {
    id: text("id").primaryKey(),
    impairTestId: text("impair_test_id").notNull().references(() => leaseImpairTest.id, { onDelete: "cascade" }),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    carryingAmount: numeric("carrying_amount").notNull(),
    allocatedLoss: numeric("allocated_loss").notNull().default("0"),
    allocatedReversal: numeric("allocated_reversal").notNull().default("0"),
    afterAmount: numeric("after_amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    testIdx: index("idx_lease_impair_line_test").on(table.impairTestId),
    componentIdx: index("idx_lease_impair_line_component").on(table.leaseComponentId)
}));

export const leaseImpairPost = pgTable("lease_impair_post", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    impairTestId: text("impair_test_id").notNull().references(() => leaseImpairTest.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    journalEntryId: text("journal_entry_id"), // references GL journal entry
    totalLoss: numeric("total_loss").notNull().default("0"),
    totalReversal: numeric("total_reversal").notNull().default("0"),
    postedBy: text("posted_by").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyPeriodTest: unique("lease_impair_post_unique").on(table.companyId, table.year, table.month, table.impairTestId),
    companyPeriodIdx: index("idx_lease_impair_post_company_period").on(table.companyId, table.year, table.month),
    testIdx: index("idx_lease_impair_post_test").on(table.impairTestId)
}));

export const leaseImpairPostLock = pgTable("lease_impair_post_lock", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    impairTestId: text("impair_test_id").notNull().references(() => leaseImpairTest.id, { onDelete: "cascade" }),
    lockedBy: text("locked_by").notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyPeriodTest: unique("lease_impair_post_lock_unique").on(table.companyId, table.year, table.month, table.impairTestId),
    companyPeriodIdx: index("idx_lease_impair_post_lock_company_period").on(table.companyId, table.year, table.month),
    testIdx: index("idx_lease_impair_post_lock_test").on(table.impairTestId)
}));

export const leaseRestorationProv = pgTable("lease_restoration_prov", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    componentId: text("component_id").references(() => leaseComponent.id, { onDelete: "cascade" }), // nullable for lease-level provisions
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    opening: numeric("opening").notNull().default("0"),
    additions: numeric("additions").notNull().default("0"),
    unwindInterest: numeric("unwind_interest").notNull().default("0"),
    utilizations: numeric("utilizations").notNull().default("0"),
    remeasurements: numeric("remeasurements").notNull().default("0"),
    closing: numeric("closing").notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyLeaseComponentPeriod: unique("lease_restoration_prov_unique").on(table.companyId, table.leaseId, table.componentId, table.year, table.month),
    companyPeriodIdx: index("idx_lease_restoration_prov_company_period").on(table.companyId, table.year, table.month),
    leaseIdx: index("idx_lease_restoration_prov_lease").on(table.leaseId),
    componentIdx: index("idx_lease_restoration_prov_component").on(table.componentId),
    leasePeriodIdx: index("idx_lease_restoration_prov_lease_period").on(table.leaseId, table.year, table.month)
}));