import { z } from 'zod';

// --- M26.2: Close Insights & Benchmarks Contracts ---

// Insights Query Parameters
export const InsightsQuery = z.object({
  from: z.string().optional(), // ISO 8601 date
  to: z.string().optional(), // ISO 8601 date
  entity_id: z.string().optional(),
  level: z.enum(['ENTITY', 'CONSOLIDATED']).optional(),
  kind: z.enum(['CLOSE', 'TASK', 'CTRL', 'FLUX', 'ANOMALY']).optional(),
  filters: z.string().optional(), // comma-separated filters like "late,breached"
});

// Benchmark Seed Request
export const BenchSeedReq = z.object({
  entity_group: z.enum(['SELF', 'PEER', 'GLOBAL']),
  metric: z.string().min(1),
  granularity: z.enum(['MONTH', 'QUARTER', 'YEAR']),
  window_start: z.string(), // ISO 8601 date
  window_end: z.string(), // ISO 8601 date
});

// Target Upsert
export const TargetUpsert = z.object({
  metric: z.string().min(1),
  target: z.number(),
  effective_from: z.string(), // ISO 8601 date
  effective_to: z.string().optional(), // ISO 8601 date
});

// Recommendation Action
export const RecoAction = z.object({
  id: z.string(),
  status: z.enum(['OPEN', 'PLANNED', 'DONE']),
  note: z.string().optional(),
});

// Export Request
export const InsightsExportReq = z.object({
  kind: z.enum(['CLOSE', 'TASK', 'CTRL', 'FLUX', 'ANOMALY']),
  format: z.enum(['csv', 'json']),
  from: z.string().optional(), // ISO 8601 date
  to: z.string().optional(), // ISO 8601 date
});

// Response Types
export const InsightsFactCloseType = z.object({
  id: z.string(),
  company_id: z.string(),
  entity_id: z.string().optional(),
  run_id: z.string().optional(),
  year: z.number(),
  month: z.number(),
  days_to_close: z.number(),
  on_time_rate: z.number(),
  late_tasks: z.number(),
  exceptions_open: z.number(),
  exceptions_material: z.number(),
  certs_done: z.number(),
  computed_at: z.string(),
});

export const InsightsFactTaskType = z.object({
  id: z.string(),
  run_id: z.string(),
  task_id: z.string(),
  code: z.string(),
  owner: z.string(),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
  sla_due_at: z.string().optional(),
  status: z.string(),
  age_hours: z.number(),
  breached: z.boolean(),
});

export const InsightsFactCtrlType = z.object({
  id: z.string(),
  ctrl_run_id: z.string(),
  control_code: z.string(),
  status: z.string(),
  severity: z.string(),
  exceptions_count: z.number(),
  waived: z.number(),
  evidence_count: z.number(),
  duration_ms: z.number(),
  material_fail: z.boolean(),
});

export const InsightsFactFluxType = z.object({
  id: z.string(),
  flux_run_id: z.string(),
  scope: z.string(),
  present_ccy: z.string(),
  material: z.number(),
  comment_missing: z.number(),
  top_delta_abs: z.number(),
  top_delta_pct: z.number(),
});

export const InsightsFactCertType = z.object({
  id: z.string(),
  run_id: z.string(),
  level: z.string(),
  signer_role: z.string(),
  signed_at: z.string(),
});

export const InsightsBenchBaselineType = z.object({
  id: z.string(),
  company_id: z.string(),
  entity_group: z.enum(['SELF', 'PEER', 'GLOBAL']),
  metric: z.string(),
  granularity: z.enum(['MONTH', 'QUARTER', 'YEAR']),
  value: z.number(),
  p50: z.number(),
  p75: z.number(),
  p90: z.number(),
  window_start: z.string(),
  window_end: z.string(),
});

export const InsightsBenchTargetType = z.object({
  id: z.string(),
  company_id: z.string(),
  metric: z.string(),
  target: z.number(),
  effective_from: z.string(),
  effective_to: z.string().optional(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const InsightsAnomalyType = z.object({
  id: z.string(),
  company_id: z.string(),
  run_id: z.string().optional(),
  kind: z.enum(['TASK', 'CONTROL', 'FLUX', 'DURATION']),
  signal: z.record(z.any()),
  score: z.number(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  opened_at: z.string(),
  closed_at: z.string().optional(),
});

export const InsightsRecoType = z.object({
  id: z.string(),
  company_id: z.string(),
  run_id: z.string().optional(),
  reco_code: z.string(),
  title: z.string(),
  detail: z.record(z.any()),
  impact_estimate: z.number(),
  effort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['OPEN', 'PLANNED', 'DONE']),
  created_at: z.string(),
  acted_at: z.string().optional(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
});

// Harvest Response
export const InsightsHarvestResponseType = z.object({
  success: z.boolean(),
  message: z.string(),
  facts_created: z.object({
    close: z.number(),
    task: z.number(),
    ctrl: z.number(),
    flux: z.number(),
    cert: z.number(),
  }),
  run_id: z.string().optional(),
});

// Benchmark Response
export const InsightsBenchmarkResponseType = z.object({
  success: z.boolean(),
  message: z.string(),
  baselines_created: z.number(),
  metrics_processed: z.array(z.string()),
});

// Anomaly Scan Response
export const InsightsAnomalyScanResponseType = z.object({
  success: z.boolean(),
  message: z.string(),
  anomalies_detected: z.number(),
  recommendations_generated: z.number(),
  high_severity_count: z.number(),
});

// Export Response
export const InsightsExportResponseType = z.object({
  success: z.boolean(),
  message: z.string(),
  download_url: z.string().optional(),
  record_count: z.number(),
  format: z.enum(['csv', 'json']),
});

// Type exports for TypeScript
export type InsightsQueryType = z.infer<typeof InsightsQuery>;
export type BenchSeedReqType = z.infer<typeof BenchSeedReq>;
export type TargetUpsertType = z.infer<typeof TargetUpsert>;
export type RecoActionType = z.infer<typeof RecoAction>;
export type InsightsExportReqType = z.infer<typeof InsightsExportReq>;
export type InsightsFactCloseResponseType = z.infer<
  typeof InsightsFactCloseType
>;
export type InsightsFactTaskResponseType = z.infer<typeof InsightsFactTaskType>;
export type InsightsFactCtrlResponseType = z.infer<typeof InsightsFactCtrlType>;
export type InsightsFactFluxResponseType = z.infer<typeof InsightsFactFluxType>;
export type InsightsFactCertResponseType = z.infer<typeof InsightsFactCertType>;
export type InsightsBenchBaselineResponseType = z.infer<
  typeof InsightsBenchBaselineType
>;
export type InsightsBenchTargetResponseType = z.infer<
  typeof InsightsBenchTargetType
>;
export type InsightsAnomalyResponseType = z.infer<typeof InsightsAnomalyType>;
export type InsightsRecoResponseType = z.infer<typeof InsightsRecoType>;
export type InsightsHarvestResponseType = z.infer<
  typeof InsightsHarvestResponseType
>;
export type InsightsBenchmarkResponseType = z.infer<
  typeof InsightsBenchmarkResponseType
>;
export type InsightsAnomalyScanResponseType = z.infer<
  typeof InsightsAnomalyScanResponseType
>;
export type InsightsExportResponseType = z.infer<
  typeof InsightsExportResponseType
>;
