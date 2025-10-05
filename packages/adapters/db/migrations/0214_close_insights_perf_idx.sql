-- M26.2: Close Insights & Benchmarks - Performance Indexes
-- Migration: 0214_close_insights_perf_idx.sql

-- Close Facts Indexes
CREATE INDEX ins_fact_close_company_run_idx ON ins_fact_close(company_id, run_id);
CREATE INDEX ins_fact_close_period_idx ON ins_fact_close(company_id, year, month);
CREATE INDEX ins_fact_close_computed_idx ON ins_fact_close(computed_at);

-- Task Facts Indexes
CREATE INDEX ins_fact_task_run_idx ON ins_fact_task(run_id);
CREATE INDEX ins_fact_task_owner_status_idx ON ins_fact_task(owner, status);
CREATE INDEX ins_fact_task_breached_idx ON ins_fact_task(breached, age_hours);
CREATE INDEX ins_fact_task_code_idx ON ins_fact_task(code, age_hours);

-- Control Facts Indexes
CREATE INDEX ins_fact_ctrl_run_idx ON ins_fact_ctrl(ctrl_run_id);
CREATE INDEX ins_fact_ctrl_status_severity_idx ON ins_fact_ctrl(status, severity);
CREATE INDEX ins_fact_ctrl_material_fail_idx ON ins_fact_ctrl(material_fail, exceptions_count);

-- Flux Facts Indexes
CREATE INDEX ins_fact_flux_run_idx ON ins_fact_flux(flux_run_id);
CREATE INDEX ins_fact_flux_scope_idx ON ins_fact_flux(scope, material);
CREATE INDEX ins_fact_flux_delta_idx ON ins_fact_flux(top_delta_abs, top_delta_pct);

-- Certification Facts Indexes
CREATE INDEX ins_fact_cert_run_idx ON ins_fact_cert(run_id);
CREATE INDEX ins_fact_cert_level_role_idx ON ins_fact_cert(level, signer_role);

-- Benchmark Indexes
CREATE INDEX ins_bench_baseline_company_metric_idx ON ins_bench_baseline(company_id, metric, entity_group);
CREATE INDEX ins_bench_baseline_window_idx ON ins_bench_baseline(window_start, window_end);
CREATE INDEX ins_bench_target_company_metric_idx ON ins_bench_target(company_id, metric, effective_from);

-- Anomaly Indexes
CREATE INDEX ins_anomaly_company_run_idx ON ins_anomaly(company_id, run_id);
CREATE INDEX ins_anomaly_score_severity_idx ON ins_anomaly(score, severity);
CREATE INDEX ins_anomaly_opened_idx ON ins_anomaly(opened_at);
CREATE INDEX ins_anomaly_kind_idx ON ins_anomaly(kind, severity);

-- Recommendation Indexes
CREATE INDEX ins_reco_company_run_idx ON ins_reco(company_id, run_id);
CREATE INDEX ins_reco_status_idx ON ins_reco(status, created_at);
CREATE INDEX ins_reco_effort_impact_idx ON ins_reco(effort, impact_estimate);

-- Comments for documentation
COMMENT ON INDEX ins_fact_close_company_run_idx IS 'Fast lookups by company and run';
COMMENT ON INDEX ins_fact_task_breached_idx IS 'Quick identification of breached tasks';
COMMENT ON INDEX ins_anomaly_score_severity_idx IS 'Anomaly filtering by severity and score';
