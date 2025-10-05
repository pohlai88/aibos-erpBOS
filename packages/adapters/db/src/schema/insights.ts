import { pgTable, text, timestamp, numeric, integer, boolean, jsonb, unique, index } from "drizzle-orm/pg-core";

// M26.2: Close Insights & Benchmarks Schema

// Import referenced tables
import { closeRun, closeTask } from "./close.js";
import { ctrlRun } from "./controls.js";
import { fluxRun } from "./close.js";

// Insights Close Facts Table
export const insFactClose = pgTable("ins_fact_close", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    entityId: text("entity_id"),
    runId: text("run_id").references(() => closeRun.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    daysToClose: numeric("days_to_close").notNull(),
    onTimeRate: numeric("on_time_rate").notNull(),
    lateTasks: integer("late_tasks").notNull().default(0),
    exceptionsOpen: integer("exceptions_open").notNull().default(0),
    exceptionsMaterial: integer("exceptions_material").notNull().default(0),
    certsDone: integer("certs_done").notNull().default(0),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    companyRunIdx: index("ins_fact_close_company_run_idx").on(table.companyId, table.runId),
    periodIdx: index("ins_fact_close_period_idx").on(table.companyId, table.year, table.month),
    computedIdx: index("ins_fact_close_computed_idx").on(table.computedAt)
}));

// Insights Task Facts Table
export const insFactTask = pgTable("ins_fact_task", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull().references(() => closeRun.id, { onDelete: "cascade" }),
    taskId: text("task_id").notNull().references(() => closeTask.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    owner: text("owner").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    status: text("status").notNull(),
    ageHours: numeric("age_hours").notNull().default("0"),
    breached: boolean("breached").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    runIdx: index("ins_fact_task_run_idx").on(table.runId),
    ownerStatusIdx: index("ins_fact_task_owner_status_idx").on(table.owner, table.status),
    breachedIdx: index("ins_fact_task_breached_idx").on(table.breached, table.ageHours),
    codeIdx: index("ins_fact_task_code_idx").on(table.code, table.ageHours)
}));

// Insights Control Facts Table
export const insFactCtrl = pgTable("ins_fact_ctrl", {
    id: text("id").primaryKey(),
    ctrlRunId: text("ctrl_run_id").notNull().references(() => ctrlRun.id, { onDelete: "cascade" }),
    controlCode: text("control_code").notNull(),
    status: text("status").notNull(),
    severity: text("severity").notNull(),
    exceptionsCount: integer("exceptions_count").notNull().default(0),
    waived: integer("waived").notNull().default(0),
    evidenceCount: integer("evidence_count").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    materialFail: boolean("material_fail").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    runIdx: index("ins_fact_ctrl_run_idx").on(table.ctrlRunId),
    statusSeverityIdx: index("ins_fact_ctrl_status_severity_idx").on(table.status, table.severity),
    materialFailIdx: index("ins_fact_ctrl_material_fail_idx").on(table.materialFail, table.exceptionsCount)
}));

// Insights Flux Facts Table
export const insFactFlux = pgTable("ins_fact_flux", {
    id: text("id").primaryKey(),
    fluxRunId: text("flux_run_id").notNull().references(() => fluxRun.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    presentCcy: text("present_ccy").notNull(),
    material: integer("material").notNull().default(0),
    commentMissing: integer("comment_missing").notNull().default(0),
    topDeltaAbs: numeric("top_delta_abs").notNull().default("0"),
    topDeltaPct: numeric("top_delta_pct").notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    runIdx: index("ins_fact_flux_run_idx").on(table.fluxRunId),
    scopeIdx: index("ins_fact_flux_scope_idx").on(table.scope, table.material),
    deltaIdx: index("ins_fact_flux_delta_idx").on(table.topDeltaAbs, table.topDeltaPct)
}));

// Insights Certification Facts Table
export const insFactCert = pgTable("ins_fact_cert", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull().references(() => closeRun.id, { onDelete: "cascade" }),
    level: text("level").notNull(),
    signerRole: text("signer_role").notNull(),
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    runIdx: index("ins_fact_cert_run_idx").on(table.runId),
    levelRoleIdx: index("ins_fact_cert_level_role_idx").on(table.level, table.signerRole)
}));

// Benchmark Baselines Table
export const insBenchBaseline = pgTable("ins_bench_baseline", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    entityGroup: text("entity_group", { enum: ["SELF", "PEER", "GLOBAL"] }).notNull(),
    metric: text("metric").notNull(),
    granularity: text("granularity", { enum: ["MONTH", "QUARTER", "YEAR"] }).notNull(),
    value: numeric("value").notNull(),
    p50: numeric("p50").notNull(),
    p75: numeric("p75").notNull(),
    p90: numeric("p90").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    companyMetricIdx: index("ins_bench_baseline_company_metric_idx").on(table.companyId, table.metric, table.entityGroup),
    windowIdx: index("ins_bench_baseline_window_idx").on(table.windowStart, table.windowEnd)
}));

// Benchmark Targets Table
export const insBenchTarget = pgTable("ins_bench_target", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    metric: text("metric").notNull(),
    target: numeric("target").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyMetricIdx: index("ins_bench_target_company_metric_idx").on(table.companyId, table.metric, table.effectiveFrom)
}));

// Anomaly Detection Table
export const insAnomaly = pgTable("ins_anomaly", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    runId: text("run_id").references(() => closeRun.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["TASK", "CONTROL", "FLUX", "DURATION"] }).notNull(),
    signal: jsonb("signal").notNull().default({}),
    score: numeric("score").notNull(),
    severity: text("severity", { enum: ["LOW", "MEDIUM", "HIGH"] }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    companyRunIdx: index("ins_anomaly_company_run_idx").on(table.companyId, table.runId),
    scoreSeverityIdx: index("ins_anomaly_score_severity_idx").on(table.score, table.severity),
    openedIdx: index("ins_anomaly_opened_idx").on(table.openedAt),
    kindIdx: index("ins_anomaly_kind_idx").on(table.kind, table.severity)
}));

// Recommendations Table
export const insReco = pgTable("ins_reco", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    runId: text("run_id").references(() => closeRun.id, { onDelete: "cascade" }),
    recoCode: text("reco_code").notNull(),
    title: text("title").notNull(),
    detail: jsonb("detail").notNull().default({}),
    impactEstimate: numeric("impact_estimate").notNull().default("0"),
    effort: text("effort", { enum: ["LOW", "MEDIUM", "HIGH"] }).notNull(),
    status: text("status", { enum: ["OPEN", "PLANNED", "DONE"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    actedAt: timestamp("acted_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull()
}, (table) => ({
    companyRunIdx: index("ins_reco_company_run_idx").on(table.companyId, table.runId),
    statusIdx: index("ins_reco_status_idx").on(table.status, table.createdAt),
    effortImpactIdx: index("ins_reco_effort_impact_idx").on(table.effort, table.impactEstimate)
}));
