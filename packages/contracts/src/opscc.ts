import { z } from 'zod';

// --- M27: Ops Command Center Contracts ---

// Enums
export const BoardTypeSchema = z.enum(['EXEC', 'TREASURY', 'AR', 'CLOSE']);
export const VizTypeSchema = z.enum(['NUMBER', 'DELTA', 'SPARK', 'TABLE']);
export const KpiBasisSchema = z.enum(['ACTUAL', 'FORECAST', 'BLENDED']);
export const AlertSeveritySchema = z.enum(['LOW', 'MED', 'HIGH', 'CRITICAL']);
export const AlertStatusSchema = z.enum(['OPEN', 'ACK', 'RESOLVED']);
export const OutboxStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

// KPI Query
export const OpsccKpiQuery = z.object({
  board: BoardTypeSchema,
  present: z.string().length(3).optional().default('USD'),
  kpi: z.string().optional(),
  limit: z.number().int().positive().optional().default(100),
});

// Board Configuration
export const BoardConfigUpsert = z.object({
  board: BoardTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  default_present_ccy: z.string().length(3).default('USD'),
  layout: z.record(z.any()).optional(),
  acl: z.record(z.any()).optional(),
});

export const BoardConfigResponse = BoardConfigUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// KPI Tile Configuration
export const TileConfigUpsert = z.object({
  board: BoardTypeSchema,
  tile_id: z.string().min(1),
  kpi: z.string().min(1),
  viz: VizTypeSchema,
  format: z.string().optional(),
  targets: z.record(z.any()).optional(),
  order_no: z.number().int().nonnegative().default(0),
});

export const TileConfigResponse = TileConfigUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  updated_at: z.string().datetime(),
});

// Alert Rules
export const AlertRuleUpsert = z.object({
  board: BoardTypeSchema,
  kpi: z.string().min(1),
  rule_id: z.string().min(1),
  expr: z.string().min(1), // CEL/JSON expression
  severity: AlertSeveritySchema,
  throttle_sec: z.number().int().positive().default(300),
  enabled: z.boolean().default(true),
});

export const AlertRuleResponse = AlertRuleUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  last_fired_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  updated_at: z.string().datetime(),
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
  updated_at: z.string().datetime(),
});

export const PlaybookExecuteReq = z.object({
  action_id: z.string().min(1),
  params: z.record(z.any()),
  dry_run: z.boolean().default(false),
});

export const PlaybookExecuteResponse = z.object({
  execution_id: z.string().uuid(),
  action_id: z.string(),
  status: z.string(),
  result: z.record(z.any()).nullable(),
  error_message: z.string().nullable(),
  executed_at: z.string().datetime(),
});

// What-If Scenarios
export const WhatIfRunReq = z.object({
  board: BoardTypeSchema,
  scenario_type: z.enum(['AR_UPLIFT', 'AP_DISCOUNT_BUDGET', 'FX_SHOCK']),
  params: z.record(z.any()),
  save_scenario: z.boolean().default(false),
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
  updated_at: z.string().datetime(),
});

export const WhatIfRunResponse = z.object({
  scenario_id: z.string().optional(),
  baseline: z.record(z.any()),
  simulation: z.record(z.any()),
  diff: z.record(z.any()),
  executed_at: z.string().datetime(),
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
  basis: KpiBasisSchema.nullable(),
});

// Board Summary
export const BoardSummaryResponse = z.object({
  board: BoardTypeSchema,
  name: z.string(),
  description: z.string().nullable(),
  default_present_ccy: z.string().length(3),
  tiles: z.array(BoardTileResponse),
  last_refreshed: z.string().datetime().nullable(),
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
  next_retry_at: z.string().datetime().nullable(),
});

// Refresh Log
export const RefreshLogResponse = z.object({
  id: z.string().uuid(),
  company_id: z.string(),
  mv_name: z.string(),
  refreshed_at: z.string().datetime(),
  rows_affected: z.number().int().nullable(),
  duration_ms: z.number().int().nullable(),
  status: z.enum(['SUCCESS', 'ERROR']),
  error_message: z.string().nullable(),
});

// M27.1: Real-Time Signals & Auto-Playbooks Contracts

// Signal Ingestion
export const SignalIngest = z.object({
  source: z.enum([
    'AR',
    'AP',
    'TREASURY',
    'CLOSE',
    'REV',
    'FX',
    'BANK',
    'CASHFLOW',
  ]),
  kind: z.string().min(1),
  kpi: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  ts: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  key: z.string().min(1),
  tags: z.array(z.string()).default([]),
  payload: z.record(z.any()).default({}),
});

export const SignalIngestBatch = z.object({
  signals: z.array(SignalIngest).min(1).max(100),
});

export const SignalResponse = z.object({
  id: z.string().uuid(),
  company_id: z.string(),
  source: z.string(),
  kind: z.string(),
  key: z.string(),
  ts: z.string().datetime(),
  payload: z.record(z.any()),
  hash: z.string(),
  dedup_until: z.string().datetime().nullable(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  kpi: z.string().nullable(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  tags: z.array(z.string()),
  inserted_at: z.string().datetime(),
});

// Rule Management
export const RuleUpsert = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  when_expr: z.record(z.any()), // JSON expression
  window_sec: z.number().int().positive().default(3600),
  threshold: z.record(z.any()),
  throttle_sec: z.number().int().nonnegative().default(3600),
  approvals: z.number().int().nonnegative().default(0),
  action_playbook_id: z.string().uuid().optional(),
});

export const RuleResponse = RuleUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  updated_by: z.string(),
  updated_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const RuleTestRequest = z.object({
  rule_id: z.string().uuid().optional(),
  when_expr: z.record(z.any()),
  window_sec: z.number().int().positive(),
  threshold: z.record(z.any()),
  test_period_hours: z.number().int().positive().default(24),
});

export const RuleTestResponse = z.object({
  prospective_fires: z.array(
    z.object({
      window_from: z.string().datetime(),
      window_to: z.string().datetime(),
      reason: z.string(),
      signal_count: z.number().int(),
      matching_signals: z.array(SignalResponse),
    })
  ),
  test_period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});

// Playbook Management
export const PlaybookUpsert = z.object({
  name: z.string().min(1),
  steps: z
    .array(
      z.object({
        action_code: z.string().min(1),
        payload: z.record(z.any()).default({}),
        when: z.string().optional(), // condition for step execution
        retry: z
          .object({
            max_attempts: z.number().int().positive().default(3),
            backoff_ms: z.number().int().positive().default(1000),
          })
          .optional(),
        on_error: z.enum(['STOP', 'CONTINUE', 'RETRY']).default('STOP'),
      })
    )
    .min(1),
  max_blast_radius: z.number().int().positive().default(100),
  dry_run_default: z.boolean().default(true),
  require_dual_control: z.boolean().default(false),
  timeout_sec: z.number().int().positive().default(300),
});

export const PlaybookResponse = PlaybookUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_by: z.string(),
  updated_at: z.string().datetime(),
});

// Fire Management
export const FireApprove = z.object({
  fire_id: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional(),
});

export const FireExecute = z.object({
  fire_id: z.string().uuid(),
  dry_run: z.boolean().default(true),
});

export const FireResponse = z.object({
  id: z.string().uuid(),
  company_id: z.string(),
  rule_id: z.string().uuid(),
  window_from: z.string().datetime(),
  window_to: z.string().datetime(),
  reason: z.string(),
  status: z.enum([
    'PENDING',
    'APPROVED',
    'EXECUTING',
    'COMPLETED',
    'FAILED',
    'SUPPRESSED',
  ]),
  approvals_needed: z.number().int(),
  approvals_got: z.number().int(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  steps: z
    .array(
      z.object({
        id: z.string().uuid(),
        step_no: z.number().int(),
        action_code: z.string(),
        dry_run: z.boolean(),
        payload: z.record(z.any()),
        attempt: z.number().int(),
        status: z.enum(['PENDING', 'OK', 'FAILED', 'RETRIED', 'SKIPPED']),
        duration_ms: z.number().int().nullable(),
        error_message: z.string().nullable(),
        result: z.record(z.any()).nullable(),
        executed_at: z.string().datetime().nullable(),
      })
    )
    .optional(),
});

// Query Contracts
export const QuerySignals = z.object({
  source: z.string().optional(),
  kind: z.string().optional(),
  kpi: z.string().optional(),
  from_ts: z.string().datetime().optional(),
  to_ts: z.string().datetime().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
});

export const QueryFires = z.object({
  rule_id: z.string().uuid().optional(),
  status: z
    .enum([
      'PENDING',
      'APPROVED',
      'EXECUTING',
      'COMPLETED',
      'FAILED',
      'SUPPRESSED',
    ])
    .optional(),
  from_ts: z.string().datetime().optional(),
  to_ts: z.string().datetime().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const DryRunRequest = z.object({
  playbook_id: z.string().uuid(),
  payload: z.record(z.any()).default({}),
  dry_run: z.boolean().default(true),
});

export const DryRunResponse = z.object({
  execution_id: z.string().uuid(),
  playbook_id: z.string().uuid(),
  steps: z.array(
    z.object({
      step_no: z.number().int(),
      action_code: z.string(),
      payload: z.record(z.any()),
      result: z.record(z.any()).nullable(),
      error_message: z.string().nullable(),
      duration_ms: z.number().int().nullable(),
    })
  ),
  total_duration_ms: z.number().int(),
  executed_at: z.string().datetime(),
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

// M27.1 Type exports
export type SignalIngest = z.infer<typeof SignalIngest>;
export type SignalIngestBatch = z.infer<typeof SignalIngestBatch>;
export type SignalResponse = z.infer<typeof SignalResponse>;
export type RuleUpsert = z.infer<typeof RuleUpsert>;
export type RuleResponse = z.infer<typeof RuleResponse>;
export type RuleTestRequest = z.infer<typeof RuleTestRequest>;
export type RuleTestResponse = z.infer<typeof RuleTestResponse>;
export type PlaybookUpsert = z.infer<typeof PlaybookUpsert>;
export type PlaybookResponse = z.infer<typeof PlaybookResponse>;
export type FireApprove = z.infer<typeof FireApprove>;
export type FireExecute = z.infer<typeof FireExecute>;
export type FireResponse = z.infer<typeof FireResponse>;
export type QuerySignals = z.infer<typeof QuerySignals>;
export type QueryFires = z.infer<typeof QueryFires>;
export type DryRunRequest = z.infer<typeof DryRunRequest>;
export type DryRunResponse = z.infer<typeof DryRunResponse>;

// M27.2: Playbook Studio + Guarded Autonomy Contracts

// Playbook Versioning
export const PlaybookVersionUpsert = z.object({
  playbook_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        action_code: z.string().min(1),
        payload: z.record(z.any()).default({}),
        when: z.string().optional(),
        retry: z
          .object({
            max_attempts: z.number().int().positive().default(3),
            backoff_ms: z.number().int().positive().default(1000),
          })
          .optional(),
        on_error: z.enum(['STOP', 'CONTINUE', 'RETRY']).default('STOP'),
      })
    )
    .min(1),
  max_blast_radius: z.number().int().positive().default(100),
  dry_run_default: z.boolean().default(true),
  require_dual_control: z.boolean().default(false),
  timeout_sec: z.number().int().positive().default(300),
  change_summary: z.string().optional(),
});

export const PlaybookVersionResponse = PlaybookVersionUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  version_no: z.number().int(),
  is_active: z.boolean(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Rule Versioning
export const RuleVersionUpsert = z.object({
  rule_id: z.string().uuid(),
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  when_expr: z.record(z.any()),
  window_sec: z.number().int().positive().default(3600),
  threshold: z.record(z.any()),
  throttle_sec: z.number().int().nonnegative().default(3600),
  approvals: z.number().int().nonnegative().default(0),
  action_playbook_id: z.string().uuid().optional(),
  change_summary: z.string().optional(),
});

export const RuleVersionResponse = RuleVersionUpsert.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  version_no: z.number().int(),
  is_active: z.boolean(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Visual Editor Contracts
export const VisualEditorSave = z.object({
  playbook_id: z.string().uuid().optional(),
  rule_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  definition: z.record(z.any()), // Visual editor JSON
  auto_version: z.boolean().default(true),
  change_summary: z.string().optional(),
});

export const VisualEditorLoad = z.object({
  playbook_id: z.string().uuid().optional(),
  rule_id: z.string().uuid().optional(),
  version_no: z.number().int().optional(),
});

// Canary Mode Contracts
export const CanaryExecutionRequest = z.object({
  fire_id: z.string().uuid(),
  playbook_id: z.string().uuid(),
  canary_scope: z.object({
    entity_type: z.string(),
    filter_criteria: z.record(z.any()),
    percentage: z.number().min(1).max(100).default(5),
    max_entities: z.number().int().positive().default(100),
  }),
  dry_run: z.boolean().default(true),
});

export const CanaryExecutionResponse = z.object({
  canary_id: z.string().uuid(),
  execution_id: z.string().uuid(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK']),
  canary_scope: z.record(z.any()),
  success_rate: z.number().nullable(),
  impact_summary: z.record(z.any()).nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
});

// Approval Workflow Contracts
export const ApprovalRequestCreate = z.object({
  fire_id: z.string().uuid(),
  playbook_id: z.string().uuid(),
  approval_type: z.enum(['DUAL_CONTROL', 'BLAST_RADIUS', 'CANARY_PROMOTION']),
  impact_estimate: z.record(z.any()),
  diff_summary: z.record(z.any()),
  blast_radius_count: z.number().int().nonnegative().default(0),
  risk_score: z.number().min(0).max(1).default(0.0),
  expires_in_hours: z.number().int().positive().default(24),
});

export const ApprovalRequestResponse = ApprovalRequestCreate.extend({
  id: z.string().uuid(),
  company_id: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
  requested_by: z.string(),
  approved_by: z.string().nullable(),
  approved_at: z.string().datetime().nullable(),
  rejection_reason: z.string().nullable(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ApprovalDecision = z.object({
  approval_id: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional(),
});

// Action Verification Contracts
export const ActionVerificationRequest = z.object({
  fire_id: z.string().uuid(),
  step_id: z.string().uuid(),
  action_code: z.string(),
  verification_type: z.enum([
    'OUTCOME_CHECK',
    'GUARDRAIL_CHECK',
    'ROLLBACK_TRIGGER',
  ]),
  expected_outcome: z.record(z.any()).optional(),
  verification_rules: z.array(
    z.object({
      rule_type: z.string(),
      threshold: z.record(z.any()),
      action: z.enum(['PASS', 'FAIL', 'WARNING', 'ROLLBACK']),
    })
  ),
});

export const ActionVerificationResponse = z.object({
  id: z.string().uuid(),
  verification_result: z.enum(['PASS', 'FAIL', 'WARNING']),
  actual_outcome: z.record(z.any()).nullable(),
  guardrail_violations: z.array(z.record(z.any())),
  rollback_triggered: z.boolean(),
  rollback_reason: z.string().nullable(),
  verified_at: z.string().datetime(),
  verified_by: z.string(),
});

// Observability Contracts
export const ExecutionMetricsQuery = z.object({
  playbook_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
  limit: z.number().int().positive().default(30),
});

export const ExecutionMetricsResponse = z.object({
  playbook_id: z.string().uuid(),
  execution_date: z.string().datetime(),
  total_executions: z.number().int(),
  successful_executions: z.number().int(),
  failed_executions: z.number().int(),
  suppressed_executions: z.number().int(),
  p50_duration_ms: z.number().int().nullable(),
  p95_duration_ms: z.number().int().nullable(),
  p99_duration_ms: z.number().int().nullable(),
  avg_duration_ms: z.number().int().nullable(),
  success_rate: z.number().nullable(),
});

export const BlastRadiusQuery = z.object({
  fire_id: z.string().uuid().optional(),
  playbook_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.number().int().positive().default(100),
});

export const BlastRadiusResponse = z.object({
  id: z.string().uuid(),
  fire_id: z.string().uuid(),
  playbook_id: z.string().uuid(),
  entity_type: z.string(),
  entity_count: z.number().int(),
  entity_ids: z.array(z.string()),
  blast_radius_percentage: z.number().nullable(),
  created_at: z.string().datetime(),
});

// Version History Contracts
export const VersionHistoryQuery = z.object({
  playbook_id: z.string().uuid().optional(),
  rule_id: z.string().uuid().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

export const VersionHistoryResponse = z.object({
  id: z.string().uuid(),
  version_no: z.number().int(),
  name: z.string(),
  change_summary: z.string().nullable(),
  is_active: z.boolean(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Type exports for M27.2
export type PlaybookVersionUpsert = z.infer<typeof PlaybookVersionUpsert>;
export type PlaybookVersionResponse = z.infer<typeof PlaybookVersionResponse>;
export type RuleVersionUpsert = z.infer<typeof RuleVersionUpsert>;
export type RuleVersionResponse = z.infer<typeof RuleVersionResponse>;
export type VisualEditorSave = z.infer<typeof VisualEditorSave>;
export type VisualEditorLoad = z.infer<typeof VisualEditorLoad>;
export type CanaryExecutionRequest = z.infer<typeof CanaryExecutionRequest>;
export type CanaryExecutionResponse = z.infer<typeof CanaryExecutionResponse>;
export type ApprovalRequestCreate = z.infer<typeof ApprovalRequestCreate>;
export type ApprovalRequestResponse = z.infer<typeof ApprovalRequestResponse>;
export type ApprovalDecision = z.infer<typeof ApprovalDecision>;
export type ActionVerificationRequest = z.infer<
  typeof ActionVerificationRequest
>;
export type ActionVerificationResponse = z.infer<
  typeof ActionVerificationResponse
>;
export type ExecutionMetricsQuery = z.infer<typeof ExecutionMetricsQuery>;
export type ExecutionMetricsResponse = z.infer<typeof ExecutionMetricsResponse>;
export type BlastRadiusQuery = z.infer<typeof BlastRadiusQuery>;
export type BlastRadiusResponse = z.infer<typeof BlastRadiusResponse>;
export type VersionHistoryQuery = z.infer<typeof VersionHistoryQuery>;
export type VersionHistoryResponse = z.infer<typeof VersionHistoryResponse>;
