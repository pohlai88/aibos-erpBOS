-- M27.1: Real-Time Signals & Auto-Playbooks - Performance Indexes
-- Migration: 0285_ops_perf_idx.sql

-- Additional performance indexes for signal processing
CREATE INDEX CONCURRENTLY idx_ops_signal_source_kind_kpi_ts_covering 
ON ops_signal(source, kind, kpi, ts) 
INCLUDE (company_id, value, severity, tags);

CREATE INDEX CONCURRENTLY idx_ops_signal_company_ts_recent 
ON ops_signal(company_id, ts DESC) 
WHERE ts >= NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY idx_ops_fire_created_at_status_covering 
ON ops_fire(created_at DESC, status) 
INCLUDE (company_id, rule_id, reason);

CREATE INDEX CONCURRENTLY idx_ops_fire_step_fire_status_attempt 
ON ops_fire_step(fire_id, status, attempt);

CREATE INDEX CONCURRENTLY idx_ops_rule_stat_last_fired_covering 
ON ops_rule_stat(last_fired_at DESC) 
INCLUDE (rule_id, fire_count, suppressed_count, last_error);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_ops_rule_enabled_active 
ON ops_rule(company_id, updated_at DESC) 
WHERE enabled = true;

CREATE INDEX CONCURRENTLY idx_ops_fire_pending_approval 
ON ops_fire(company_id, created_at DESC) 
WHERE status IN ('PENDING', 'APPROVED');

CREATE INDEX CONCURRENTLY idx_ops_fire_step_pending_retry 
ON ops_fire_step(fire_id, step_no) 
WHERE status IN ('PENDING', 'FAILED') AND attempt < 3;

-- Comments for documentation
COMMENT ON INDEX idx_ops_signal_source_kind_kpi_ts_covering IS 'Covering index for signal queries with common filters';
COMMENT ON INDEX idx_ops_signal_company_ts_recent IS 'Recent signals for real-time processing';
COMMENT ON INDEX idx_ops_fire_created_at_status_covering IS 'Covering index for fire queries with status';
COMMENT ON INDEX idx_ops_fire_step_fire_status_attempt IS 'Fire step status and retry tracking';
COMMENT ON INDEX idx_ops_rule_stat_last_fired_covering IS 'Rule statistics with last fired time';
COMMENT ON INDEX idx_ops_rule_enabled_active IS 'Active rules for evaluation';
COMMENT ON INDEX idx_ops_fire_pending_approval IS 'Fires awaiting approval or execution';
COMMENT ON INDEX idx_ops_fire_step_pending_retry IS 'Steps pending execution or retry';
