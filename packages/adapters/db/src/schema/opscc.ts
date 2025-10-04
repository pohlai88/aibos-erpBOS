import { pgTable, text, char, timestamp, numeric, integer, jsonb, uuid, boolean } from "drizzle-orm/pg-core";

// M27: Ops Command Center Schema

// KPI snapshots for real-time dashboard
export const kpiSnapshot = pgTable("kpi_snapshot", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    board: text("board").notNull().$type<"EXEC" | "TREASURY" | "AR" | "CLOSE">(),
    kpi: text("kpi").notNull(),
    ts_utc: timestamp("ts_utc", { withTimezone: true }).notNull().defaultNow(),
    value: numeric("value", { precision: 28, scale: 6 }),
    num: integer("num"),
    den: integer("den"),
    meta: jsonb("meta"),
    present_ccy: char("present_ccy", { length: 3 }).notNull().default("USD"),
    basis: text("basis").notNull().$type<"ACTUAL" | "FORECAST" | "BLENDED">().default("ACTUAL"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Board configurations
export const boardConfig = pgTable("board_config", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    board: text("board").notNull().$type<"EXEC" | "TREASURY" | "AR" | "CLOSE">(),
    name: text("name").notNull(),
    description: text("description"),
    default_present_ccy: char("default_present_ccy", { length: 3 }).notNull().default("USD"),
    layout: jsonb("layout"),
    acl: jsonb("acl"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// KPI tile configurations
export const kpiTileConfig = pgTable("kpi_tile_config", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    board: text("board").notNull().$type<"EXEC" | "TREASURY" | "AR" | "CLOSE">(),
    tile_id: text("tile_id").notNull(),
    kpi: text("kpi").notNull(),
    viz: text("viz").notNull().$type<"NUMBER" | "DELTA" | "SPARK" | "TABLE">(),
    format: text("format"),
    targets: jsonb("targets"),
    order_no: integer("order_no").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Alert rules
export const alertRule = pgTable("alert_rule", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    board: text("board").notNull().$type<"EXEC" | "TREASURY" | "AR" | "CLOSE">(),
    kpi: text("kpi").notNull(),
    rule_id: text("rule_id").notNull(),
    expr: text("expr").notNull(),
    severity: text("severity").notNull().$type<"LOW" | "MED" | "HIGH" | "CRITICAL">(),
    throttle_sec: integer("throttle_sec").notNull().default(3600),
    enabled: boolean("enabled").notNull().default(true),
    last_fired_at: timestamp("last_fired_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Playbook actions
export const playbookAction = pgTable("playbook_action", {
    id: uuid("id").primaryKey().defaultRandom(),
    action_id: text("action_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    parameter_schema: jsonb("parameter_schema").notNull(),
    required_capability: text("required_capability").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Alert events
export const alertEvent = pgTable("alert_event", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    rule_id: uuid("rule_id").notNull(),
    board: text("board").notNull().$type<"EXEC" | "TREASURY" | "AR" | "CLOSE">(),
    kpi: text("kpi").notNull(),
    snapshot_id: uuid("snapshot_id"),
    severity: text("severity").notNull().$type<"LOW" | "MED" | "HIGH" | "CRITICAL">(),
    message: text("message").notNull(),
    action_suggestion_id: uuid("action_suggestion_id"),
    status: text("status").notNull().$type<"OPEN" | "ACK" | "RESOLVED">().default("OPEN"),
    fired_at: timestamp("fired_at", { withTimezone: true }).notNull().defaultNow(),
    acked_at: timestamp("acked_at", { withTimezone: true }),
    resolved_at: timestamp("resolved_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// What-if scenarios
export const whatifScenario = pgTable("whatif_scenario", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    board: text("board").notNull().$type<"EXEC" | "TREASURY" | "AR" | "CLOSE">(),
    scenario_id: text("scenario_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    params: jsonb("params").notNull(),
    baseline_at: timestamp("baseline_at", { withTimezone: true }).notNull(),
    diff: jsonb("diff"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// KPI refresh log
export const kpiRefreshLog = pgTable("kpi_refresh_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    mv_name: text("mv_name").notNull(),
    refreshed_at: timestamp("refreshed_at", { withTimezone: true }).notNull().defaultNow(),
    rows_affected: integer("rows_affected"),
    duration_ms: integer("duration_ms"),
    status: text("status").notNull().$type<"SUCCESS" | "ERROR">().default("SUCCESS"),
    error_message: text("error_message"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// OpsCC outbox
export const opsccOutbox = pgTable("opscc_outbox", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    event_type: text("event_type").notNull(),
    event_data: jsonb("event_data").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    processed_at: timestamp("processed_at", { withTimezone: true }),
    retry_count: integer("retry_count").notNull().default(0),
    max_retries: integer("max_retries").notNull().default(3),
    status: text("status").notNull().$type<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED">().default("PENDING"),
    error_message: text("error_message"),
    next_retry_at: timestamp("next_retry_at", { withTimezone: true })
});

// M27.1: Real-Time Signals & Auto-Playbooks Tables

// Signal ingestion table
export const opsSignal = pgTable("ops_signal", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    source: text("source").notNull(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    payload: jsonb("payload").notNull().default({}),
    hash: text("hash").notNull(),
    dedup_until: timestamp("dedup_until", { withTimezone: true }),
    severity: text("severity").notNull().$type<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">().default("MEDIUM"),
    kpi: text("kpi"),
    value: numeric("value", { precision: 28, scale: 6 }),
    unit: text("unit"),
    tags: text("tags").array().default([]),
    inserted_at: timestamp("inserted_at", { withTimezone: true }).notNull().defaultNow()
});

// Rule definition table
export const opsRule = pgTable("ops_rule", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    severity: text("severity").notNull().$type<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">().default("HIGH"),
    when_expr: jsonb("when_expr").notNull(),
    window_sec: integer("window_sec").notNull().default(3600),
    threshold: jsonb("threshold").notNull(),
    throttle_sec: integer("throttle_sec").notNull().default(3600),
    approvals: integer("approvals").notNull().default(0),
    action_playbook_id: uuid("action_playbook_id"),
    updated_by: text("updated_by").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// Rule execution statistics
export const opsRuleStat = pgTable("ops_rule_stat", {
    rule_id: uuid("rule_id").primaryKey(),
    last_fired_at: timestamp("last_fired_at", { withTimezone: true }),
    fire_count: integer("fire_count").notNull().default(0),
    suppressed_count: integer("suppressed_count").notNull().default(0),
    last_error: text("last_error"),
    last_error_at: timestamp("last_error_at", { withTimezone: true }),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Playbook definitions
export const opsPlaybook = pgTable("ops_playbook", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    name: text("name").notNull(),
    steps: jsonb("steps").notNull(),
    max_blast_radius: integer("max_blast_radius").notNull().default(100),
    dry_run_default: boolean("dry_run_default").notNull().default(true),
    require_dual_control: boolean("require_dual_control").notNull().default(false),
    timeout_sec: integer("timeout_sec").notNull().default(300),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_by: text("updated_by").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Action registry
export const opsActionRegistry = pgTable("ops_action_registry", {
    code: text("code").primaryKey(),
    description: text("description").notNull(),
    caps_required: text("caps_required").array().notNull().default([]),
    dry_run_supported: boolean("dry_run_supported").notNull().default(true),
    payload_schema: jsonb("payload_schema").notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Rule firing events
export const opsFire = pgTable("ops_fire", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    rule_id: uuid("rule_id").notNull(),
    window_from: timestamp("window_from", { withTimezone: true }).notNull(),
    window_to: timestamp("window_to", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().$type<"PENDING" | "APPROVED" | "EXECUTING" | "COMPLETED" | "FAILED" | "SUPPRESSED">().default("PENDING"),
    approvals_needed: integer("approvals_needed").notNull().default(0),
    approvals_got: integer("approvals_got").notNull().default(0),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Individual playbook step executions
export const opsFireStep = pgTable("ops_fire_step", {
    id: uuid("id").primaryKey().defaultRandom(),
    fire_id: uuid("fire_id").notNull(),
    step_no: integer("step_no").notNull(),
    action_code: text("action_code").notNull(),
    dry_run: boolean("dry_run").notNull().default(true),
    payload: jsonb("payload").notNull().default({}),
    attempt: integer("attempt").notNull().default(1),
    status: text("status").notNull().$type<"PENDING" | "OK" | "FAILED" | "RETRIED" | "SKIPPED">().default("PENDING"),
    duration_ms: integer("duration_ms"),
    error_message: text("error_message"),
    result: jsonb("result"),
    executed_at: timestamp("executed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Guardrail locks
export const opsGuardrailLock = pgTable("ops_guardrail_lock", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    until_ts: timestamp("until_ts", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// Quorum voting
export const opsQuorumVote = pgTable("ops_quorum_vote", {
    id: uuid("id").primaryKey().defaultRandom(),
    fire_id: uuid("fire_id").notNull(),
    actor_id: text("actor_id").notNull(),
    decision: text("decision").notNull().$type<"APPROVE" | "REJECT">(),
    reason: text("reason"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow()
});