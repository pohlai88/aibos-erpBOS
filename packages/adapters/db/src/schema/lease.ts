import { pgTable, text, timestamp, numeric, integer, boolean, jsonb, date, unique, index } from "drizzle-orm/pg-core";
import { asc } from "drizzle-orm";

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
    journalId: text("journal_id"), // reference to posted journal
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
    // M28.5: Extended fields for sublease and SLB disclosures
    subleaseIncome: numeric("sublease_income").notNull().default("0"), // operating sublease income
    financeSubleaseInterest: numeric("finance_sublease_interest").notNull().default("0"), // finance sublease interest income
    nisClosing: numeric("nis_closing").notNull().default("0"), // net investment in sublease closing balance
    slbGains: numeric("slb_gains").notNull().default("0"), // SLB gains recognized
    slbDeferredGainCarry: numeric("slb_deferred_gain_carry").notNull().default("0"), // SLB deferred gain carryforward
    slbCashProceeds: numeric("slb_cash_proceeds").notNull().default("0"), // SLB cash proceeds
    // M28.6: Extended fields for impairment and onerous disclosures
    impairmentLoss: numeric("impairment_loss").notNull().default("0"), // impairment loss recognized during period
    impairmentReversal: numeric("impairment_reversal").notNull().default("0"), // impairment reversal recognized during period
    onerousCharge: numeric("onerous_charge").notNull().default("0"), // onerous contract provision charged during period
    onerousUnwind: numeric("onerous_unwind").notNull().default("0"), // onerous contract provision unwind during period
    onerousUtilization: numeric("onerous_utilization").notNull().default("0"), // onerous contract provision utilized during period
    onerousClosing: numeric("onerous_closing").notNull().default("0"), // onerous contract provision closing balance
    // M28.7: Extended fields for exit and restoration disclosures
    terminations: numeric("terminations").notNull().default("0"), // total termination amounts
    partialDerecognition: numeric("partial_derecognition").notNull().default("0"), // partial termination amounts
    buyouts: numeric("buyouts").notNull().default("0"), // buyout amounts
    restorationCharge: numeric("restoration_charge").notNull().default("0"), // restoration provision charged
    restorationUnwind: numeric("restoration_unwind").notNull().default("0"), // restoration provision unwind
    restorationUtilization: numeric("restoration_utilization").notNull().default("0"), // restoration provision utilized
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
    closingRou: numeric("closing_rou"), // closing ROU asset amount
    closingLiability: numeric("closing_liability"), // closing lease liability amount
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

// M28.4: Lease Modifications & Indexation Remeasurements

export const leaseIndexProfile = pgTable("lease_index_profile", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    indexCode: text("index_code").notNull(), // CPI index code (e.g., CPI-US, CPI-UK)
    lagMonths: integer("lag_months").notNull().default(0), // publication lag in months
    capPct: numeric("cap_pct"), // maximum increase percentage (null = no cap)
    floorPct: numeric("floor_pct"), // minimum increase percentage (null = no floor)
    fxSrcCcy: text("fx_src_ccy"), // source currency for FX-indexed leases
    resetFreq: text("reset_freq").notNull(), // Monthly, Quarterly, Semi-Annual, Annual
    nextResetOn: date("next_reset_on").notNull(),
    lastIndexValue: numeric("last_index_value"), // last applied index value
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    uniqueLeaseIndex: unique("lease_index_profile_unique").on(table.leaseId, table.indexCode),
    companyIdx: index("idx_lease_index_profile_company").on(table.companyId),
    leaseIdx: index("idx_lease_index_profile_lease").on(table.leaseId),
    nextResetIdx: index("idx_lease_index_profile_next_reset").on(table.nextResetOn),
    indexCodeIdx: index("idx_lease_index_profile_index_code").on(table.indexCode)
}));

export const leaseMod = pgTable("lease_mod", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    effectiveOn: date("effective_on").notNull(),
    kind: text("kind").notNull(), // INDEXATION, CONCESSION, SCOPE, TERM
    reason: text("reason").notNull(),
    status: text("status").notNull().default("DRAFT"), // DRAFT, APPLIED, POSTED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyIdx: index("idx_lease_mod_company").on(table.companyId),
    leaseIdx: index("idx_lease_mod_lease").on(table.leaseId),
    effectiveIdx: index("idx_lease_mod_effective").on(table.effectiveOn),
    statusIdx: index("idx_lease_mod_status").on(table.status)
}));

export const leaseModLine = pgTable("lease_mod_line", {
    id: text("id").primaryKey(),
    modId: text("mod_id").notNull().references(() => leaseMod.id, { onDelete: "cascade" }),
    leaseComponentId: text("lease_component_id").references(() => leaseComponent.id, { onDelete: "cascade" }), // null for lease-level changes
    action: text("action").notNull(), // INCREASE, DECREASE, RENT_FREE, DEFERRAL, EXTEND, SHORTEN, RATE_RESET, AREA_CHANGE
    qtyDelta: numeric("qty_delta"), // quantity change (for area/scope modifications)
    amountDelta: numeric("amount_delta"), // amount change
    notes: jsonb("notes"), // additional details
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    modIdx: index("idx_lease_mod_line_mod").on(table.modId),
    componentIdx: index("idx_lease_mod_line_component").on(table.leaseComponentId)
}));

export const leaseIndexValue = pgTable("lease_index_value", {
    companyId: text("company_id").notNull(),
    indexCode: text("index_code").notNull(),
    indexDate: date("index_date").notNull(),
    value: numeric("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    pk: unique("lease_index_value_pk").on(table.companyId, table.indexCode, table.indexDate),
    companyCodeIdx: index("idx_lease_index_value_company_code").on(table.companyId, table.indexCode),
    dateIdx: index("idx_lease_index_value_date").on(table.indexDate)
}));

export const leaseRemeasurePost = pgTable("lease_remeasure_post", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    modId: text("mod_id").notNull().references(() => leaseMod.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    journalEntryId: text("journal_entry_id").notNull(),
    totalLiabilityDelta: numeric("total_liability_delta").notNull(),
    totalRouDelta: numeric("total_rou_delta").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    postedBy: text("posted_by").notNull()
}, (table) => ({
    uniqueCompanyLeaseModPeriod: unique("lease_remeasure_post_unique").on(table.companyId, table.leaseId, table.modId, table.year, table.month),
    companyIdx: index("idx_lease_remeasure_post_company").on(table.companyId),
    leaseIdx: index("idx_lease_remeasure_post_lease").on(table.leaseId),
    modIdx: index("idx_lease_remeasure_post_mod").on(table.modId),
    periodIdx: index("idx_lease_remeasure_post_period").on(table.year, table.month)
}));

export const leaseRemeasurePostLock = pgTable("lease_remeasure_post_lock", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull(),
    modId: text("mod_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    lockedBy: text("locked_by").notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCompanyLeaseModPeriod: unique("lease_remeasure_post_lock_unique").on(table.companyId, table.leaseId, table.modId, table.year, table.month)
}));

export const leaseConcessionPolicy = pgTable("lease_concession_policy", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    method: text("method").notNull(), // STRAIGHT_LINE, TRUE_MOD
    componentAlloc: text("component_alloc").notNull(), // PRORATA, TARGETED
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    uniqueCompany: unique("lease_concession_policy_unique").on(table.companyId),
    companyIdx: index("idx_lease_concession_policy_company").on(table.companyId)
}));

export const leaseComponentSchedDelta = pgTable("lease_component_sched_delta", {
    id: text("id").primaryKey(),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    modId: text("mod_id").notNull().references(() => leaseMod.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    liabDelta: numeric("liab_delta").notNull().default("0"),
    rouDelta: numeric("rou_delta").notNull().default("0"),
    interestDelta: numeric("interest_delta").notNull().default("0"),
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueComponentModPeriod: unique("lease_component_sched_delta_unique").on(table.leaseComponentId, table.modId, table.year, table.month),
    componentIdx: index("idx_lease_sched_delta_component").on(table.leaseComponentId),
    modIdx: index("idx_lease_sched_delta_mod").on(table.modId),
    periodIdx: index("idx_lease_sched_delta_period").on(table.year, table.month),
    componentPeriodIdx: index("idx_lease_sched_delta_component_period").on(table.leaseComponentId, table.year, table.month)
}));

// M28.5: Subleases & Sale-and-Leaseback (MFRS 16)

export const sublease = pgTable("sublease", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    headLeaseId: text("head_lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    subleaseCode: text("sublease_code").notNull().unique(),
    startOn: date("start_on").notNull(),
    endOn: date("end_on").notNull(),
    classification: text("classification").notNull(), // FINANCE, OPERATING
    ccy: text("ccy").notNull(), // 3-char currency code
    rate: numeric("rate"), // effective interest rate for finance sublease
    evidencePackId: text("evidence_pack_id"), // reference to evidence pack
    status: text("status").notNull().default("DRAFT"), // DRAFT, ACTIVE, TERMINATED, EXPIRED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyIdx: index("idx_sublease_company").on(table.companyId),
    headLeaseIdx: index("idx_sublease_head_lease").on(table.headLeaseId),
    classificationIdx: index("idx_sublease_classification").on(table.classification),
    statusIdx: index("idx_sublease_status").on(table.status),
}));

export const subleaseCf = pgTable("sublease_cf", {
    id: text("id").primaryKey(),
    subleaseId: text("sublease_id").notNull().references(() => sublease.id, { onDelete: "cascade" }),
    dueOn: date("due_on").notNull(),
    amount: numeric("amount").notNull(),
    variable: jsonb("variable"), // variable payment details
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    subleaseIdx: index("idx_sublease_cf_sublease").on(table.subleaseId),
    dueOnIdx: index("idx_sublease_cf_due_on").on(table.dueOn),
    subleaseDueIdx: index("idx_sublease_cf_sublease_due").on(table.subleaseId, table.dueOn)
}));

export const subleaseSchedule = pgTable("sublease_schedule", {
    id: text("id").primaryKey(),
    subleaseId: text("sublease_id").notNull().references(() => sublease.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    openingNis: numeric("opening_nis"), // net investment in sublease (finance only)
    interestIncome: numeric("interest_income"), // interest income (finance only)
    receipt: numeric("receipt").notNull(),
    closingNis: numeric("closing_nis"), // net investment in sublease (finance only)
    leaseIncome: numeric("lease_income"), // lease income (operating only)
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueSubleasePeriod: unique("sublease_schedule_unique").on(table.subleaseId, table.year, table.month),
    subleaseIdx: index("idx_sublease_schedule_sublease").on(table.subleaseId),
    periodIdx: index("idx_sublease_schedule_period").on(table.year, table.month),
    subleasePeriodIdx: index("idx_sublease_schedule_sublease_period").on(table.subleaseId, table.year, table.month)
}));

export const subleaseEvent = pgTable("sublease_event", {
    id: text("id").primaryKey(),
    subleaseId: text("sublease_id").notNull().references(() => sublease.id, { onDelete: "cascade" }),
    effectiveOn: date("effective_on").notNull(),
    kind: text("kind").notNull(), // INDEX, TERM, SCOPE, DEFERRAL
    payload: jsonb("payload").notNull(), // event-specific data
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    subleaseIdx: index("idx_sublease_event_sublease").on(table.subleaseId),
    effectiveIdx: index("idx_sublease_event_effective").on(table.effectiveOn),
    subleaseEffectiveIdx: index("idx_sublease_event_sublease_effective").on(table.subleaseId, table.effectiveOn)
}));

export const subleasePostLock = pgTable("sublease_post_lock", {
    id: text("id").primaryKey(),
    subleaseId: text("sublease_id").notNull().references(() => sublease.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    journalId: text("journal_id"), // reference to posted journal
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    postedBy: text("posted_by").notNull()
}, (table) => ({
    uniqueSubleasePeriod: unique("sublease_post_lock_unique").on(table.subleaseId, table.year, table.month),
    subleaseIdx: index("idx_sublease_post_lock_sublease").on(table.subleaseId),
    periodIdx: index("idx_sublease_post_lock_period").on(table.year, table.month)
}));

export const leaseComponentSublet = pgTable("lease_component_sublet", {
    id: text("id").primaryKey(),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    subleaseId: text("sublease_id").notNull().references(() => sublease.id, { onDelete: "cascade" }),
    proportion: numeric("proportion").notNull(), // proportion of component sublet (0-1)
    method: text("method").notNull().default("PROPORTIONATE"), // PROPORTIONATE, SPECIFIC
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    uniqueComponentSublease: unique("lease_component_sublet_unique").on(table.leaseComponentId, table.subleaseId),
    componentIdx: index("idx_lease_component_sublet_component").on(table.leaseComponentId),
    subleaseIdx: index("idx_lease_component_sublet_sublease").on(table.subleaseId),
    proportionIdx: index("idx_lease_component_sublet_proportion").on(table.proportion)
}));

export const slbTxn = pgTable("slb_txn", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    assetId: text("asset_id"), // reference to fixed asset if applicable
    assetDesc: text("asset_desc").notNull(), // asset description
    saleDate: date("sale_date").notNull(),
    salePrice: numeric("sale_price").notNull(),
    fmv: numeric("fmv").notNull(), // fair market value
    ccy: text("ccy").notNull(), // 3-char currency code
    controlTransferred: boolean("control_transferred").notNull().default(false), // MFRS 15 transfer of control
    leasebackId: text("leaseback_id").references(() => lease.id, { onDelete: "set null" }), // reference to leaseback lease
    evidencePackId: text("evidence_pack_id"), // reference to evidence pack
    status: text("status").notNull().default("DRAFT"), // DRAFT, MEASURED, POSTED, COMPLETED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyIdx: index("idx_slb_txn_company").on(table.companyId),
    assetIdx: index("idx_slb_txn_asset").on(table.assetId),
    saleDateIdx: index("idx_slb_txn_sale_date").on(table.saleDate),
    statusIdx: index("idx_slb_txn_status").on(table.status),
    leasebackIdx: index("idx_slb_txn_leaseback").on(table.leasebackId),
}));

export const slbAllocation = pgTable("slb_allocation", {
    id: text("id").primaryKey(),
    slbId: text("slb_id").notNull().references(() => slbTxn.id, { onDelete: "cascade" }),
    proportionTransferred: numeric("proportion_transferred").notNull(), // proportion transferred (0-1)
    gainRecognized: numeric("gain_recognized").notNull().default("0"), // immediate gain recognition
    gainDeferred: numeric("gain_deferred").notNull().default("0"), // deferred gain liability
    rouRetained: numeric("rou_retained").notNull().default("0"), // ROU asset retained
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    slbIdx: index("idx_slb_allocation_slb").on(table.slbId)
}));

export const slbMeasure = pgTable("slb_measure", {
    id: text("id").primaryKey(),
    slbId: text("slb_id").notNull().references(() => slbTxn.id, { onDelete: "cascade" }),
    adjKind: text("adj_kind").notNull(), // ABOVE_FAIR_VALUE, BELOW_FAIR_VALUE, COSTS
    amount: numeric("amount").notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    slbIdx: index("idx_slb_measure_slb").on(table.slbId),
    kindIdx: index("idx_slb_measure_kind").on(table.adjKind)
}));

// M28.6: Lease Impairment & Onerous Contracts Tables (MFRS/IFRS 16 + IAS 36/37)

export const leaseCgu = pgTable("lease_cgu", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyCodeIdx: index("idx_lease_cgu_company_code").on(table.companyId, table.code),
    companyIdx: index("idx_lease_cgu_company").on(table.companyId)
}));

export const leaseCguLink = pgTable("lease_cgu_link", {
    id: text("id").primaryKey(),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    cguId: text("cgu_id").notNull().references(() => leaseCgu.id, { onDelete: "cascade" }),
    weight: numeric("weight").notNull(), // allocation weight (0-1)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    componentIdx: index("idx_lease_cgu_link_component").on(table.leaseComponentId),
    cguIdx: index("idx_lease_cgu_link_cgu").on(table.cguId),
    uniqueComponentCgu: unique("lease_cgu_link_unique").on(table.leaseComponentId, table.cguId)
}));

export const leaseImpIndicator = pgTable("lease_imp_indicator", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    asOfDate: date("as_of_date").notNull(),
    cguId: text("cgu_id").references(() => leaseCgu.id, { onDelete: "cascade" }),
    leaseComponentId: text("lease_component_id").references(() => leaseComponent.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // BUDGET_SHORTFALL, VACANCY, MARKET_RENT_DROP, SUBLEASE_LOSS, OTHER
    value: jsonb("value").notNull(), // indicator-specific data
    severity: text("severity").notNull(), // LOW, MEDIUM, HIGH
    source: text("source").notNull(), // source of indicator
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    dateIdx: index("idx_lease_imp_indicator_date").on(table.asOfDate),
    cguIdx: index("idx_lease_imp_indicator_cgu").on(table.cguId),
    componentIdx: index("idx_lease_imp_indicator_component").on(table.leaseComponentId),
    companyDateIdx: index("idx_lease_imp_indicator_company_date").on(table.companyId, table.asOfDate)
}));

export const leaseImpTest = pgTable("lease_imp_test", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    cguId: text("cgu_id").notNull().references(() => leaseCgu.id, { onDelete: "cascade" }),
    cguCode: text("cgu_code").notNull(),
    level: text("level").notNull(), // COMPONENT, CGU
    asOfDate: date("as_of_date").notNull(),
    method: text("method").notNull(), // VIU, FVLCD, HIGHER
    discountRate: numeric("discount_rate").notNull(),
    cashflows: jsonb("cashflows").notNull(),
    carryingAmount: numeric("carrying_amount").notNull(),
    recoverableAmount: numeric("recoverable_amount").notNull(),
    loss: numeric("loss").notNull().default("0"),
    reversalCap: numeric("reversal_cap").notNull().default("0"),
    trigger: text("trigger").notNull(), // INDICATOR, ANNUAL, MANUAL
    status: text("status").notNull().default("DRAFT"), // DRAFT, MEASURED, POSTED
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    dateCguIdx: index("idx_lease_imp_test_date_cgu").on(table.asOfDate, table.cguId),
    statusIdx: index("idx_lease_imp_test_status").on(table.status),
    companyDateIdx: index("idx_lease_imp_test_company_date").on(table.companyId, table.asOfDate),
}));

export const leaseImpLine = pgTable("lease_imp_line", {
    id: text("id").primaryKey(),
    impairTestId: text("impair_test_id").notNull().references(() => leaseImpTest.id, { onDelete: "cascade" }),
    leaseComponentId: text("lease_component_id").notNull().references(() => leaseComponent.id, { onDelete: "cascade" }),
    carryingAmount: numeric("carrying_amount").notNull(),
    allocatedLoss: numeric("allocated_loss").notNull().default("0"),
    allocatedReversal: numeric("allocated_reversal").notNull().default("0"),
    afterAmount: numeric("after_amount").notNull().default("0"),
    carrying: numeric("carrying"), // carrying amount for impairment calculation
    allocPct: numeric("alloc_pct"), // allocation percentage
    loss: numeric("loss"), // impairment loss amount
    reversalCap: numeric("reversal_cap"), // reversal cap amount
    testId: text("test_id"), // test identifier
    posted: boolean("posted").notNull().default(false),
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    testIdx: index("idx_lease_imp_line_test").on(table.impairTestId),
    componentIdx: index("idx_lease_imp_line_component").on(table.leaseComponentId)
}));

export const leaseImpPostLock = pgTable("lease_imp_post_lock", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    impairTestId: text("impair_test_id").notNull().references(() => leaseImpTest.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    journalId: text("journal_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: text("posted_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    testIdx: index("idx_lease_imp_post_lock_test").on(table.impairTestId),
    uniqueTestPeriod: unique("lease_imp_post_lock_unique").on(table.impairTestId, table.year, table.month)
}));

export const leaseImpPost = pgTable("lease_imp_post", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    impairTestId: text("impair_test_id").notNull().references(() => leaseImpTest.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    journalEntryId: text("journal_entry_id"),
    totalLoss: numeric("total_loss").notNull().default("0"),
    totalReversal: numeric("total_reversal").notNull().default("0"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: text("posted_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    testIdx: index("idx_lease_imp_post_test").on(table.impairTestId),
    periodIdx: index("idx_lease_imp_post_period").on(table.year, table.month),
    uniqueTestPeriod: unique("lease_imp_post_unique").on(table.impairTestId, table.year, table.month)
}));

export const leaseOnerousAssessment = pgTable("lease_onerous_assessment", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    asOfDate: date("as_of_date").notNull(),
    leaseComponentId: text("lease_component_id").references(() => leaseComponent.id, { onDelete: "cascade" }),
    serviceItem: text("service_item").notNull(),
    termMonths: integer("term_months").notNull(),
    unavoidableCost: numeric("unavoidable_cost").notNull(),
    expectedBenefit: numeric("expected_benefit").notNull(),
    provision: numeric("provision").notNull().default("0"),
    status: text("status").notNull().default("DRAFT"), // DRAFT, RECOGNIZED, RELEASED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    dateIdx: index("idx_onerous_assessment_date").on(table.asOfDate),
    componentIdx: index("idx_onerous_assessment_component").on(table.leaseComponentId),
    statusIdx: index("idx_onerous_assessment_status").on(table.status),
    companyDateIdx: index("idx_onerous_assessment_company_date").on(table.companyId, table.asOfDate),
}));

export const leaseOnerousRoll = pgTable("lease_onerous_roll", {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull().references(() => leaseOnerousAssessment.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    opening: numeric("opening").notNull().default("0"),
    charge: numeric("charge").notNull().default("0"),
    unwind: numeric("unwind").notNull().default("0"),
    utilization: numeric("utilization").notNull().default("0"),
    closing: numeric("closing").notNull().default("0"),
    posted: boolean("posted").notNull().default(false),
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    assessmentIdx: index("idx_onerous_roll_assessment").on(table.assessmentId),
    periodIdx: index("idx_onerous_roll_period").on(table.year, table.month),
    uniqueAssessmentPeriod: unique("onerous_roll_unique").on(table.assessmentId, table.year, table.month)
}));

export const leaseOnerousPostLock = pgTable("lease_onerous_post_lock", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    assessmentId: text("assessment_id").notNull().references(() => leaseOnerousAssessment.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    journalId: text("journal_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: text("posted_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    assessmentIdx: index("idx_onerous_post_lock_assessment").on(table.assessmentId),
    uniqueAssessmentPeriod: unique("onerous_post_lock_unique").on(table.assessmentId, table.year, table.month)
}));

// M28.7: Lease Derecognition, Early Termination & Surrenders Tables

export const leaseExit = pgTable("lease_exit", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    componentId: text("component_id").references(() => leaseComponent.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    kind: text("kind").notNull(), // FULL, PARTIAL, BUYOUT, EXPIRY
    reason: text("reason").notNull(),
    settlement: numeric("settlement").notNull().default("0"),
    penalty: numeric("penalty").notNull().default("0"),
    restoration: numeric("restoration").notNull().default("0"),
    status: text("status").notNull().default("DRAFT"), // DRAFT, POSTED
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyDateIdx: index("idx_lease_exit_company_date").on(table.companyId, table.eventDate),
    leaseIdx: index("idx_lease_exit_lease").on(table.leaseId),
    componentIdx: index("idx_lease_exit_component").on(table.componentId),
    statusIdx: index("idx_lease_exit_status").on(table.status)
}));

export const leaseExitCalc = pgTable("lease_exit_calc", {
    id: text("id").primaryKey(),
    exitId: text("exit_id").notNull().references(() => leaseExit.id, { onDelete: "cascade" }),
    carryingRou: numeric("carrying_rou").notNull(),
    carryingLiab: numeric("carrying_liab").notNull(),
    sharePct: numeric("share_pct").notNull().default("100.0000"),
    derecogRou: numeric("derecog_rou").notNull(),
    derecogLiab: numeric("derecog_liab").notNull(),
    gainLoss: numeric("gain_loss").notNull().default("0"),
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    exitIdx: index("idx_lease_exit_calc_exit").on(table.exitId)
}));

export const leaseExitFx = pgTable("lease_exit_fx", {
    id: text("id").primaryKey(),
    exitId: text("exit_id").notNull().references(() => leaseExit.id, { onDelete: "cascade" }),
    rateSrc: text("rate_src").notNull(),
    presentCcy: text("present_ccy").notNull(),
    spot: numeric("spot").notNull(),
    policy: text("policy").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    exitIdx: index("idx_lease_exit_fx_exit").on(table.exitId)
}));

export const leaseExitPostLock = pgTable("lease_exit_post_lock", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    leaseId: text("lease_id").references(() => lease.id, { onDelete: "cascade" }),
    componentId: text("component_id").references(() => leaseComponent.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    status: text("status").notNull().default("LOCKED"), // LOCKED, POSTING, POSTED, ERROR
    journalId: text("journal_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: text("posted_by"),
    errorMsg: text("error_msg"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    companyDateIdx: index("idx_lease_exit_post_lock_company_date").on(table.companyId, table.eventDate),
    leaseIdx: index("idx_lease_exit_post_lock_lease").on(table.leaseId),
    componentIdx: index("idx_lease_exit_post_lock_component").on(table.componentId),
    statusIdx: index("idx_lease_exit_post_lock_status").on(table.status),
    uniqueCompanyLeaseComponentDate: unique("lease_exit_post_lock_unique").on(table.companyId, table.leaseId, table.componentId, table.eventDate)
}));

export const leaseRestoration = pgTable("lease_restoration", {
    id: text("id").primaryKey(),
    leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
    componentId: text("component_id").references(() => leaseComponent.id, { onDelete: "cascade" }),
    asOfDate: date("as_of_date").notNull(),
    estimate: numeric("estimate").notNull(),
    discountRate: numeric("discount_rate").notNull(),
    opening: numeric("opening").notNull().default("0"),
    charge: numeric("charge").notNull().default("0"),
    unwind: numeric("unwind").notNull().default("0"),
    utilization: numeric("utilization").notNull().default("0"),
    closing: numeric("closing").notNull().default("0"),
    posted: boolean("posted").notNull().default(false),
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    leaseIdx: index("idx_lease_restoration_lease").on(table.leaseId),
    componentIdx: index("idx_lease_restoration_component").on(table.componentId),
    dateIdx: index("idx_lease_restoration_date").on(table.asOfDate),
    postedIdx: index("idx_lease_restoration_posted").on(table.posted),
    uniqueLeaseComponentDate: unique("lease_restoration_unique").on(table.leaseId, table.componentId, table.asOfDate)
}));

export const leaseBuyoutFaLink = pgTable("lease_buyout_fa_link", {
    id: text("id").primaryKey(),
    exitId: text("exit_id").notNull().references(() => leaseExit.id, { onDelete: "cascade" }),
    faAssetId: text("fa_asset_id").notNull(),
    transferAmount: numeric("transfer_amount").notNull(),
    transferDate: date("transfer_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull()
}, (table) => ({
    exitIdx: index("idx_lease_buyout_fa_link_exit").on(table.exitId),
    faIdx: index("idx_lease_buyout_fa_link_fa").on(table.faAssetId),
    dateIdx: index("idx_lease_buyout_fa_link_date").on(table.transferDate),
    uniqueExitFa: unique("lease_buyout_fa_link_unique").on(table.exitId, table.faAssetId)
}));

export const leaseExitEvidence = pgTable("lease_exit_evidence", {
    id: text("id").primaryKey(),
    exitId: text("exit_id").notNull().references(() => leaseExit.id, { onDelete: "cascade" }),
    evidenceId: text("evidence_id").notNull(),
    evidenceType: text("evidence_type").notNull(), // TERMINATION_LETTER, SETTLEMENT_INVOICE, MAKE_GOOD_REPORT, BUYOUT_AGREEMENT, RESTORATION_QUOTE, OTHER
    description: text("description"),
    uploadedBy: text("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    exitIdx: index("idx_lease_exit_evidence_exit").on(table.exitId),
    typeIdx: index("idx_lease_exit_evidence_type").on(table.evidenceType),
    uploadedIdx: index("idx_lease_exit_evidence_uploaded").on(table.uploadedAt),
    uniqueExitEvidence: unique("lease_exit_evidence_unique").on(table.exitId, table.evidenceId)
}));