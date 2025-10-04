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
