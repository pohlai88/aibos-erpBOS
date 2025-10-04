-- M26: Performance Indexes
-- Additional indexes for optimal query performance

-- Close task performance indexes
CREATE INDEX close_task_status_sla_idx ON close_task(status, sla_due_at) WHERE sla_due_at IS NOT NULL;
CREATE INDEX close_task_priority_status_idx ON close_task(priority DESC, status);

-- Flux analysis performance indexes
CREATE INDEX flux_line_material_desc_idx ON flux_line(material, ABS(delta) DESC) WHERE material = TRUE;
CREATE INDEX flux_run_company_cmp_period_idx ON flux_run(company_id, cmp_year, cmp_month, created_at DESC);

-- Close run performance indexes
CREATE INDEX close_run_owner_status_idx ON close_run(owner, status, started_at);
CREATE INDEX close_run_closed_at_idx ON close_run(closed_at DESC) WHERE closed_at IS NOT NULL;

-- Evidence performance indexes
CREATE INDEX close_evidence_kind_idx ON close_evidence(kind, added_at DESC);

-- KPI performance indexes
CREATE INDEX close_kpi_metric_value_idx ON close_kpi(metric, value DESC, computed_at DESC);

-- Comments
COMMENT ON INDEX close_task_status_sla_idx IS 'Optimized for SLA breach queries';
COMMENT ON INDEX flux_line_material_desc_idx IS 'Optimized for top movers queries';
COMMENT ON INDEX flux_run_company_cmp_period_idx IS 'Optimized for period-based flux queries';
COMMENT ON INDEX close_run_owner_status_idx IS 'Optimized for owner workload queries';
COMMENT ON INDEX close_kpi_metric_value_idx IS 'Optimized for KPI trend analysis';
