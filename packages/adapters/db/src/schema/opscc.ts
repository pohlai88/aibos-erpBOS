import { pgTable, text, char, timestamp, numeric, integer, jsonb, uuid, boolean, unique } from "drizzle-orm/pg-core";

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

// Rule definition table (M27.1 - legacy)
export const opsRuleLegacy = pgTable("ops_rule_legacy", {
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

// Playbook definitions (M27.1 - legacy)
export const opsPlaybookLegacy = pgTable("ops_playbook_legacy", {
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

// M27.2: Playbook Studio + Guarded Autonomy Tables

// ops_rule — rule metadata & schedule (M27.2)
export const opsRule = pgTable("ops_rule", {
    id: text("id").primaryKey(),
    company_id: text("company_id").notNull(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    kind: text("kind").notNull().$type<"alert" | "periodic" | "manual">(),
    enabled: boolean("enabled").notNull().default(true),
    source: text("source"), // signal bus selector
    where_jsonb: jsonb("where_jsonb"), // filter
    schedule_cron: text("schedule_cron"), // cron expression for periodic rules
    priority: integer("priority").notNull().default(0),
    created_by: text("created_by").notNull(),
    updated_by: text("updated_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    // Additional columns expected by the code
    severity: text("severity").$type<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">().default("HIGH"),
    when_expr: jsonb("when_expr"), // Rule condition expression
    window_sec: integer("window_sec").default(3600), // Time window for rule evaluation
    threshold: jsonb("threshold"), // Threshold configuration
    throttle_sec: integer("throttle_sec").default(3600), // Throttling period
    approvals: integer("approvals").default(0), // Required approvals
    action_playbook_id: text("action_playbook_id") // Reference to playbook to execute
});

// ops_playbook — versioned playbook definition (M27.2)
export const opsPlaybook = pgTable("ops_playbook", {
    id: text("id").primaryKey(),
    company_id: text("company_id").notNull(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    status: text("status").notNull().$type<"draft" | "active" | "archived">().default("draft"),
    latest_version: integer("latest_version").notNull().default(0),
    created_by: text("created_by").notNull(),
    updated_by: text("updated_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// ops_playbook_version — immutable versions (M27.2)
export const opsPlaybookVersion = pgTable("ops_playbook_version", {
    id: text("id").primaryKey(),
    company_id: text("company_id").notNull(),
    playbook_id: text("playbook_id").notNull().references(() => opsPlaybook.id, { onDelete: "cascade" }),
    version_no: integer("version_no").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    steps: jsonb("steps").notNull().default([]),
    max_blast_radius: integer("max_blast_radius").notNull().default(100),
    dry_run_default: boolean("dry_run_default").notNull().default(true),
    require_dual_control: boolean("require_dual_control").notNull().default(false),
    timeout_sec: integer("timeout_sec").notNull().default(300),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    is_active: boolean("is_active").notNull().default(false),
    change_summary: text("change_summary"),
    // Additional columns expected by the code
    version: integer("version_no").notNull(), // Alias for version_no for code compatibility
    spec_jsonb: jsonb("spec_jsonb"), // Playbook specification
    hash: text("hash") // Content hash for versioning
}, (table) => ({
    uniquePlaybookVersion: unique("unique_playbook_version").on(table.company_id, table.playbook_id, table.version_no)
}));

// ops_guard_policy — guardrails at company/playbook scope (M27.2)
export const opsGuardPolicy = pgTable("ops_guard_policy", {
    id: text("id").primaryKey(),
    company_id: text("company_id").notNull(),
    scope: text("scope").notNull(), // 'global' or 'playbook:<code>'
    max_concurrent: integer("max_concurrent").notNull().default(1),
    blast_radius: jsonb("blast_radius"), // allowed entity counts, % thresholds
    requires_dual_control: boolean("requires_dual_control").notNull().default(false),
    canary: jsonb("canary"), // sample %, min N
    rollback_policy: jsonb("rollback_policy"), // how to revert
    timeout_sec: integer("timeout_sec").notNull().default(900),
    cooldown_sec: integer("cooldown_sec").notNull().default(3600),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updated_by: text("updated_by").notNull()
});

// ops_run — execution header (M27.2)
export const opsRun = pgTable("ops_run", {
    id: text("id").primaryKey(),
    company_id: text("company_id").notNull(),
    rule_id: text("rule_id").references(() => opsRule.id),
    playbook_version_id: text("playbook_version_id").notNull().references(() => opsPlaybookVersion.id),
    trigger: text("trigger").notNull().$type<"cron" | "signal" | "manual" | "canary">(),
    status: text("status").notNull().$type<"queued" | "approved" | "running" | "rolled_back" | "succeeded" | "failed" | "cancelled" | "cooling_down">().default("queued"),
    canary: boolean("canary").notNull().default(false),
    scope_jsonb: jsonb("scope_jsonb"), // entities impacted
    blast_radius_eval: jsonb("blast_radius_eval"), // evaluation results
    approvals_jsonb: jsonb("approvals_jsonb"), // approval tracking
    metrics_jsonb: jsonb("metrics_jsonb"), // execution metrics
    started_at: timestamp("started_at", { withTimezone: true }),
    ended_at: timestamp("ended_at", { withTimezone: true }),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// ops_run_step — step-by-step execution (M27.2)
export const opsRunStep = pgTable("ops_run_step", {
    id: text("id").primaryKey(),
    run_id: text("run_id").notNull().references(() => opsRun.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    action_code: text("action_code").notNull(),
    input_jsonb: jsonb("input_jsonb").notNull(),
    output_jsonb: jsonb("output_jsonb"),
    status: text("status").notNull().$type<"pending" | "running" | "succeeded" | "failed" | "rolled_back">().default("pending"),
    duration_ms: integer("duration_ms"),
    rolled_back: boolean("rolled_back").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// ops_rollback_step — mirrors steps for revert (M27.2)
export const opsRollbackStep = pgTable("ops_rollback_step", {
    id: text("id").primaryKey(),
    run_step_id: text("run_step_id").notNull().references(() => opsRunStep.id, { onDelete: "cascade" }),
    action_code: text("action_code").notNull(),
    input_jsonb: jsonb("input_jsonb").notNull(),
    status: text("status").notNull().$type<"pending" | "running" | "succeeded" | "failed">().default("pending"),
    duration_ms: integer("duration_ms"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// ops_outbox — event stream (append-only) (M27.2)
export const opsOutbox = pgTable("ops_outbox", {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    key: text("key").notNull(),
    payload_jsonb: jsonb("payload_jsonb").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// ops_cap — capability grants for playbook codes (for fine-grain approvals) (M27.2)
export const opsCap = pgTable("ops_cap", {
    id: text("id").primaryKey(),
    company_id: text("company_id").notNull(),
    playbook_code: text("playbook_code").notNull(),
    capability: text("capability").notNull().$type<"ops:playbook:approve" | "ops:playbook:execute" | "ops:run:read">(),
    role: text("role").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
    uniqueCapability: unique("unique_capability").on(table.company_id, table.playbook_code, table.capability, table.role)
}));

// Rule versions for git-like history  
export const opsRuleVersion = pgTable("ops_rule_version", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    rule_id: uuid("rule_id").notNull(),
    version_no: integer("version_no").notNull(),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    severity: text("severity").notNull().$type<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">().default("HIGH"),
    when_expr: jsonb("when_expr").notNull(),
    window_sec: integer("window_sec").notNull().default(3600),
    threshold: jsonb("threshold").notNull(),
    throttle_sec: integer("throttle_sec").notNull().default(3600),
    approvals: integer("approvals").notNull().default(0),
    action_playbook_id: uuid("action_playbook_id"),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    is_active: boolean("is_active").notNull().default(false),
    change_summary: text("change_summary")
});

// Dry-run sandbox executions
export const opsDryRunExecution = pgTable("ops_dry_run_execution", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    playbook_id: uuid("playbook_id").notNull(),
    version_no: integer("version_no"),
    execution_id: uuid("execution_id").notNull(),
    steps: jsonb("steps").notNull().default([]),
    total_duration_ms: integer("total_duration_ms"),
    executed_at: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
    created_by: text("created_by").notNull(),
    status: text("status").notNull().$type<"RUNNING" | "COMPLETED" | "FAILED">().default("COMPLETED"),
    error_message: text("error_message"),
    result_summary: jsonb("result_summary")
});

// Canary mode executions (scoped subset before global)
export const opsCanaryExecution = pgTable("ops_canary_execution", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    fire_id: uuid("fire_id").notNull(),
    playbook_id: uuid("playbook_id").notNull(),
    canary_scope: jsonb("canary_scope").notNull(),
    execution_id: uuid("execution_id").notNull(),
    status: text("status").notNull().$type<"PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "ROLLED_BACK">().default("PENDING"),
    started_at: timestamp("started_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    rollback_at: timestamp("rollback_at", { withTimezone: true }),
    success_rate: numeric("success_rate", { precision: 5, scale: 2 }),
    impact_summary: jsonb("impact_summary"),
    created_by: text("created_by").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Human-in-the-loop approvals with premortem diffs
export const opsApprovalRequest = pgTable("ops_approval_request", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    fire_id: uuid("fire_id").notNull(),
    playbook_id: uuid("playbook_id").notNull(),
    requested_by: text("requested_by").notNull(),
    approval_type: text("approval_type").notNull().$type<"DUAL_CONTROL" | "BLAST_RADIUS" | "CANARY_PROMOTION">(),
    impact_estimate: jsonb("impact_estimate").notNull(),
    diff_summary: jsonb("diff_summary").notNull(),
    blast_radius_count: integer("blast_radius_count").notNull().default(0),
    risk_score: numeric("risk_score", { precision: 3, scale: 2 }).notNull().default("0.0"),
    status: text("status").notNull().$type<"PENDING" | "APPROVED" | "REJECTED" | "EXPIRED">().default("PENDING"),
    approved_by: text("approved_by"),
    approved_at: timestamp("approved_at", { withTimezone: true }),
    rejection_reason: text("rejection_reason"),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Post-action verification and rollback hooks
export const opsActionVerification = pgTable("ops_action_verification", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    fire_id: uuid("fire_id").notNull(),
    step_id: uuid("step_id").notNull(),
    action_code: text("action_code").notNull(),
    verification_type: text("verification_type").notNull().$type<"OUTCOME_CHECK" | "GUARDRAIL_CHECK" | "ROLLBACK_TRIGGER">(),
    expected_outcome: jsonb("expected_outcome"),
    actual_outcome: jsonb("actual_outcome"),
    verification_result: text("verification_result").notNull().$type<"PASS" | "FAIL" | "WARNING">(),
    guardrail_violations: jsonb("guardrail_violations").default([]),
    rollback_triggered: boolean("rollback_triggered").notNull().default(false),
    rollback_reason: text("rollback_reason"),
    verified_at: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
    verified_by: text("verified_by").notNull()
});

// Observability metrics for success/failure rates and performance
export const opsExecutionMetrics = pgTable("ops_execution_metrics", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    playbook_id: uuid("playbook_id").notNull(),
    execution_date: timestamp("execution_date", { withTimezone: true }).notNull(),
    total_executions: integer("total_executions").notNull().default(0),
    successful_executions: integer("successful_executions").notNull().default(0),
    failed_executions: integer("failed_executions").notNull().default(0),
    suppressed_executions: integer("suppressed_executions").notNull().default(0),
    p50_duration_ms: integer("p50_duration_ms"),
    p95_duration_ms: integer("p95_duration_ms"),
    p99_duration_ms: integer("p99_duration_ms"),
    avg_duration_ms: integer("avg_duration_ms"),
    success_rate: numeric("success_rate", { precision: 5, scale: 2 }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// Blast radius tracking for safety caps
export const opsBlastRadiusLog = pgTable("ops_blast_radius_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_id: text("company_id").notNull(),
    fire_id: uuid("fire_id").notNull(),
    playbook_id: uuid("playbook_id").notNull(),
    entity_type: text("entity_type").notNull(),
    entity_count: integer("entity_count").notNull(),
    entity_ids: jsonb("entity_ids").default([]),
    blast_radius_percentage: numeric("blast_radius_percentage", { precision: 5, scale: 2 }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});