import { pgTable, uuid, text, boolean, timestamp, numeric, jsonb, integer, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// M26.5: SOX 302/404 Pack - Core Tables

export const soxKeyControl = pgTable("sox_key_control", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    process: text("process").notNull(), // e.g., R2R, O2C, P2P, ITGC
    riskStmt: text("risk_stmt").notNull(), // risk statement
    assertion: text("assertion").notNull(), // e.g., E/O, C/O, V/A, P/D
    frequency: text("frequency").notNull(), // DAILY|WEEKLY|MONTHLY|QUARTERLY|ADHOC
    automation: text("automation").notNull(), // MANUAL|IT_DEP|AUTOMATED
    ownerId: text("owner_id").notNull(),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    companyCodeIdx: index("idx_sox_key_control_company_code").on(table.companyId, table.code),
    companyProcessIdx: index("idx_sox_key_control_company_process").on(table.companyId, table.process),
    companyOwnerIdx: index("idx_sox_key_control_company_owner").on(table.companyId, table.ownerId),
    companyActiveIdx: index("idx_sox_key_control_company_active").on(table.companyId, table.active),
}));

export const soxControlScope = pgTable("sox_control_scope", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    controlId: uuid("control_id").notNull().references(() => soxKeyControl.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // YYYYQn or YYYY-MM
    inScope: boolean("in_scope").notNull().default(true),
    materiality: numeric("materiality", { precision: 18, scale: 2 }),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    companyPeriodIdx: index("idx_sox_control_scope_company_period").on(table.companyId, table.period),
    controlPeriodIdx: index("idx_sox_control_scope_control_period").on(table.controlId, table.period),
}));

// Testing Tables
export const soxTestPlan = pgTable("sox_test_plan", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    controlId: uuid("control_id").notNull().references(() => soxKeyControl.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // YYYYQn
    attributes: jsonb("attributes").notNull(), // list of attributes to test
    sampleMethod: text("sample_method").notNull(), // RANDOM|JUDGMENTAL|ALL
    sampleSize: integer("sample_size").notNull(),
    preparedBy: text("prepared_by").notNull(),
    preparedAt: timestamp("prepared_at", { withTimezone: true }).notNull().defaultNow(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    status: text("status").notNull().default("DRAFT"), // DRAFT|APPROVED|LOCKED
}, (table) => ({
    companyPeriodIdx: index("idx_sox_test_plan_company_period").on(table.companyId, table.period),
    controlPeriodIdx: index("idx_sox_test_plan_control_period").on(table.controlId, table.period),
    statusIdx: index("idx_sox_test_plan_status").on(table.status, table.preparedAt),
}));

export const soxTestSample = pgTable("sox_test_sample", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    planId: uuid("plan_id").notNull().references(() => soxTestPlan.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(), // sampled item reference
    pickedReason: text("picked_reason"),
}, (table) => ({
    planIdx: index("idx_sox_test_sample_plan").on(table.planId),
    companyIdx: index("idx_sox_test_sample_company").on(table.companyId),
}));

export const soxTestResult = pgTable("sox_test_result", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    planId: uuid("plan_id").notNull().references(() => soxTestPlan.id, { onDelete: "cascade" }),
    sampleId: uuid("sample_id").references(() => soxTestSample.id, { onDelete: "set null" }),
    attribute: text("attribute").notNull(),
    outcome: text("outcome").notNull(), // PASS|FAIL|N/A
    note: text("note"),
    evdRecordId: uuid("evd_record_id").references(() => evdRecord.id, { onDelete: "set null" }),
    testedBy: text("tested_by").notNull(),
    testedAt: timestamp("tested_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    companyPlanIdx: index("idx_sox_test_result_company_plan").on(table.companyId, table.planId),
    planTestedAtIdx: index("idx_sox_test_result_plan_tested_at").on(table.planId, table.testedAt),
    outcomeIdx: index("idx_sox_test_result_outcome").on(table.outcome, table.testedAt),
    evdRecordIdx: index("idx_sox_test_result_evd_record").on(table.evdRecordId),
}));

// Deficiency Tables
export const soxDeficiency: any = pgTable("sox_deficiency", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    controlId: uuid("control_id").references(() => soxKeyControl.id, { onDelete: "set null" }),
    discoveredIn: text("discovered_in").notNull(), // YYYYQn
    type: text("type").notNull(), // DESIGN|OPERATING
    severity: text("severity").notNull(), // INCONSEQUENTIAL|SIGNIFICANT|MATERIAL
    description: text("description").notNull(),
    rootCause: text("root_cause"),
    aggregationId: uuid("aggregation_id").references((): any => soxDeficiency.id, { onDelete: "set null" }),
    remOwnerId: text("rem_owner_id"),
    remediationPlan: text("remediation_plan"),
    remediationDue: date("remediation_due"),
    status: text("status").notNull().default("OPEN"), // OPEN|IN_PROGRESS|VALIDATING|CLOSED
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    companyStatusIdx: index("idx_sox_deficiency_company_status").on(table.companyId, table.status),
    companySeverityIdx: index("idx_sox_deficiency_company_severity").on(table.companyId, table.severity),
    statusSeverityIdx: index("idx_sox_deficiency_status_severity").on(table.status, table.severity),
    discoveredInIdx: index("idx_sox_deficiency_discovered_in").on(table.discoveredIn),
    controlIdx: index("idx_sox_deficiency_control").on(table.controlId),
    remOwnerIdx: index("idx_sox_deficiency_rem_owner").on(table.remOwnerId),
    createdAtIdx: index("idx_sox_deficiency_created_at").on(table.createdAt),
}));

export const soxDeficiencyLink = pgTable("sox_deficiency_link", {
    id: uuid("id").primaryKey().defaultRandom(),
    deficiencyId: uuid("deficiency_id").notNull().references(() => soxDeficiency.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // TEST_RESULT|INCIDENT|AUDIT
    sourceId: text("source_id").notNull(),
}, (table) => ({
    deficiencyIdx: index("idx_sox_deficiency_link_deficiency").on(table.deficiencyId),
    sourceIdx: index("idx_sox_deficiency_link_source").on(table.source, table.sourceId),
}));

// Assertion Tables
export const soxAssertion = pgTable("sox_assertion", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: text("company_id").notNull(),
    period: text("period").notNull(), // YYYYQn or YYYY
    type: text("type").notNull(), // 302|404
    statement: jsonb("statement").notNull(), // declarative payload
    ebinderId: uuid("ebinder_id").references(() => evdBinder.id, { onDelete: "set null" }),
    signedBy: text("signed_by").notNull(),
    signedRole: text("signed_role").notNull(), // CEO|CFO|CONTROLLER
    sha256Hex: text("sha256_hex").notNull(),
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    companyTypeIdx: index("idx_sox_assertion_company_type").on(table.companyId, table.type),
    companyPeriodIdx: index("idx_sox_assertion_company_period").on(table.companyId, table.period),
    typePeriodIdx: index("idx_sox_assertion_type_period").on(table.type, table.period),
    signedByIdx: index("idx_sox_assertion_signed_by").on(table.signedBy),
    signedAtIdx: index("idx_sox_assertion_signed_at").on(table.signedAt),
}));

// Relations
export const soxKeyControlRelations = relations(soxKeyControl, ({ many }) => ({
    scopes: many(soxControlScope),
    testPlans: many(soxTestPlan),
    deficiencies: many(soxDeficiency),
}));

export const soxControlScopeRelations = relations(soxControlScope, ({ one }) => ({
    control: one(soxKeyControl, {
        fields: [soxControlScope.controlId],
        references: [soxKeyControl.id],
    }),
}));

export const soxTestPlanRelations = relations(soxTestPlan, ({ one, many }) => ({
    control: one(soxKeyControl, {
        fields: [soxTestPlan.controlId],
        references: [soxKeyControl.id],
    }),
    samples: many(soxTestSample),
    results: many(soxTestResult),
}));

export const soxTestSampleRelations = relations(soxTestSample, ({ one, many }) => ({
    plan: one(soxTestPlan, {
        fields: [soxTestSample.planId],
        references: [soxTestPlan.id],
    }),
    results: many(soxTestResult),
}));

export const soxTestResultRelations = relations(soxTestResult, ({ one }) => ({
    plan: one(soxTestPlan, {
        fields: [soxTestResult.planId],
        references: [soxTestPlan.id],
    }),
    sample: one(soxTestSample, {
        fields: [soxTestResult.sampleId],
        references: [soxTestSample.id],
    }),
    evidenceRecord: one(evdRecord, {
        fields: [soxTestResult.evdRecordId],
        references: [evdRecord.id],
    }),
}));

export const soxDeficiencyRelations = relations(soxDeficiency, ({ one, many }) => ({
    control: one(soxKeyControl, {
        fields: [soxDeficiency.controlId],
        references: [soxKeyControl.id],
    }),
    aggregation: one(soxDeficiency, {
        fields: [soxDeficiency.aggregationId],
        references: [soxDeficiency.id],
    }),
    links: many(soxDeficiencyLink),
}));

export const soxDeficiencyLinkRelations = relations(soxDeficiencyLink, ({ one }) => ({
    deficiency: one(soxDeficiency, {
        fields: [soxDeficiencyLink.deficiencyId],
        references: [soxDeficiency.id],
    }),
}));

export const soxAssertionRelations = relations(soxAssertion, ({ one }) => ({
    ebinder: one(evdBinder, {
        fields: [soxAssertion.ebinderId],
        references: [evdBinder.id],
    }),
}));

// Import evdRecord and evdBinder from evidence schema
import { evdRecord, evdBinder } from "./evidence.js";
