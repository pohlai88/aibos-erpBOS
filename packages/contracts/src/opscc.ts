import { z } from "zod";

// --- M27: Ops Command Center Contracts ---

// Enums
export const BoardTypeSchema = z.enum(["EXEC", "TREASURY", "AR", "CLOSE"]);
export const VizTypeSchema = z.enum(["NUMBER", "DELTA", "SPARK", "TABLE"]);
export const KpiBasisSchema = z.enum(["ACTUAL", "FORECAST", "BLENDED"]);
export const AlertSeveritySchema = z.enum(["LOW", "MED", "HIGH", "CRITICAL"]);
export const AlertStatusSchema = z.enum(["OPEN", "ACK", "RESOLVED"]);
export const OutboxStatusSchema = z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]);

// KPI Query
export const OpsccKpiQuery = z.object({
    board: BoardTypeSchema,
    present: z.string().length(3).optional().default("USD"),
    kpi: z.string().optional(),
    limit: z.number().int().positive().optional().default(100)
});

// Board Configuration
export const BoardConfigUpsert = z.object({
    board: BoardTypeSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    default_present_ccy: z.string().length(3).default("USD"),
    layout: z.record(z.any()).optional(),
    acl: z.record(z.any()).optional()
});

export const BoardConfigResponse = BoardConfigUpsert.extend({
    id: z.string().uuid(),
    company_id: z.string(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

// KPI Tile Configuration
export const TileConfigUpsert = z.object({
    board: BoardTypeSchema,
    tile_id: z.string().min(1),
    kpi: z.string().min(1),
    viz: VizTypeSchema,
    format: z.string().optional(),
    targets: z.record(z.any()).optional(),
    order_no: z.number().int().nonnegative().default(0)
});

export const TileConfigResponse = TileConfigUpsert.extend({
    id: z.string().uuid(),
    company_id: z.string(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

// KPI Snapshot
export const KpiSnapshotResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    board: BoardTypeSchema,
    kpi: z.string(),
    ts_utc: z.string().datetime(),
    value: z.number().nullable(),
    num: z.number().int().nullable(),
    den: z.number().int().nullable(),
    meta: z.record(z.any()).nullable(),
    present_ccy: z.string().length(3),
    basis: KpiBasisSchema,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

// Alert Rules
export const AlertRuleUpsert = z.object({
    board: BoardTypeSchema,
    kpi: z.string().min(1),
    rule_id: z.string().min(1),
    expr: z.string().min(1), // CEL/JSON expression
    severity: AlertSeveritySchema,
    throttle_sec: z.number().int().positive().default(300),
    enabled: z.boolean().default(true)
});

export const AlertRuleResponse = AlertRuleUpsert.extend({
    id: z.string().uuid(),
    company_id: z.string(),
    last_fired_at: z.string().datetime().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

// Alert Events
export const AlertEventResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    board: BoardTypeSchema,
    kpi: z.string(),
    severity: AlertSeveritySchema,
    message: z.string(),
    action_suggestion_id: z.string().uuid().nullable(),
    status: AlertStatusSchema,
    fired_at: z.string().datetime(),
    acked_at: z.string().datetime().nullable(),
    resolved_at: z.string().datetime().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

// Playbook Actions
export const PlaybookActionResponse = z.object({
    id: z.string().uuid(),
    action_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    parameter_schema: z.record(z.any()),
    required_capability: z.string(),
    enabled: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

export const PlaybookExecuteReq = z.object({
    action_id: z.string().min(1),
    params: z.record(z.any()),
    dry_run: z.boolean().default(false)
});

export const PlaybookExecuteResponse = z.object({
    execution_id: z.string().uuid(),
    action_id: z.string(),
    status: z.string(),
    result: z.record(z.any()).nullable(),
    error_message: z.string().nullable(),
    executed_at: z.string().datetime()
});

// What-If Scenarios
export const WhatIfRunReq = z.object({
    board: BoardTypeSchema,
    scenario_type: z.enum(["AR_UPLIFT", "AP_DISCOUNT_BUDGET", "FX_SHOCK"]),
    params: z.record(z.any()),
    save_scenario: z.boolean().default(false)
});

export const WhatIfScenario = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    board: BoardTypeSchema,
    scenario_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    params: z.record(z.any()),
    baseline_at: z.string().datetime(),
    diff: z.record(z.any()).nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
});

export const WhatIfRunResponse = z.object({
    scenario_id: z.string().optional(),
    baseline: z.record(z.any()),
    simulation: z.record(z.any()),
    diff: z.record(z.any()),
    executed_at: z.string().datetime()
});

// Board Tile with KPI Data
export const BoardTileResponse = z.object({
    tile_id: z.string(),
    kpi: z.string(),
    viz: VizTypeSchema,
    format: z.string().nullable(),
    targets: z.record(z.any()).nullable(),
    order_no: z.number().int(),
    board_name: z.string(),
    board_description: z.string().nullable(),
    default_present_ccy: z.string().length(3),
    value: z.number().nullable(),
    last_updated: z.string().datetime().nullable(),
    basis: KpiBasisSchema.nullable()
});

// Board Summary
export const BoardSummaryResponse = z.object({
    board: BoardTypeSchema,
    name: z.string(),
    description: z.string().nullable(),
    default_present_ccy: z.string().length(3),
    tiles: z.array(BoardTileResponse),
    last_refreshed: z.string().datetime().nullable()
});

// Outbox Events
export const OutboxEventResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    event_type: z.string(),
    event_data: z.record(z.any()),
    created_at: z.string().datetime(),
    processed_at: z.string().datetime().nullable(),
    retry_count: z.number().int(),
    max_retries: z.number().int(),
    status: OutboxStatusSchema,
    error_message: z.string().nullable(),
    next_retry_at: z.string().datetime().nullable()
});

// Refresh Log
export const RefreshLogResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    mv_name: z.string(),
    refreshed_at: z.string().datetime(),
    rows_affected: z.number().int().nullable(),
    duration_ms: z.number().int().nullable(),
    status: z.enum(["SUCCESS", "ERROR"]),
    error_message: z.string().nullable()
});

// Type exports
export type BoardType = z.infer<typeof BoardTypeSchema>;
export type VizType = z.infer<typeof VizTypeSchema>;
export type KpiBasis = z.infer<typeof KpiBasisSchema>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type AlertStatus = z.infer<typeof AlertStatusSchema>;
export type OutboxStatus = z.infer<typeof OutboxStatusSchema>;

export type OpsccKpiQuery = z.infer<typeof OpsccKpiQuery>;
export type BoardConfigUpsert = z.infer<typeof BoardConfigUpsert>;
export type BoardConfigResponse = z.infer<typeof BoardConfigResponse>;
export type TileConfigUpsert = z.infer<typeof TileConfigUpsert>;
export type TileConfigResponse = z.infer<typeof TileConfigResponse>;
export type KpiSnapshotResponse = z.infer<typeof KpiSnapshotResponse>;
export type AlertRuleUpsert = z.infer<typeof AlertRuleUpsert>;
export type AlertRuleResponse = z.infer<typeof AlertRuleResponse>;
export type AlertEventResponse = z.infer<typeof AlertEventResponse>;
export type PlaybookActionResponse = z.infer<typeof PlaybookActionResponse>;
export type PlaybookExecuteReq = z.infer<typeof PlaybookExecuteReq>;
export type PlaybookExecuteResponse = z.infer<typeof PlaybookExecuteResponse>;
export type WhatIfRunReq = z.infer<typeof WhatIfRunReq>;
export type WhatIfScenario = z.infer<typeof WhatIfScenario>;
export type WhatIfRunResponse = z.infer<typeof WhatIfRunResponse>;
export type BoardTileResponse = z.infer<typeof BoardTileResponse>;
export type BoardSummaryResponse = z.infer<typeof BoardSummaryResponse>;
export type OutboxEventResponse = z.infer<typeof OutboxEventResponse>;
export type RefreshLogResponse = z.infer<typeof RefreshLogResponse>;
