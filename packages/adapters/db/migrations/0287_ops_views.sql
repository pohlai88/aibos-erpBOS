-- M27.1: Real-Time Signals & Auto-Playbooks - Materialized Views
-- Migration: 0287_ops_views.sql

-- Recent signals view (last N minutes)
CREATE MATERIALIZED VIEW ops_signal_recent_v AS
SELECT 
    company_id,
    source,
    kind,
    kpi,
    COUNT(*) as signal_count,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    MAX(ts) as latest_ts,
    MIN(ts) as earliest_ts
FROM ops_signal
WHERE ts >= NOW() - INTERVAL '1 hour'
GROUP BY company_id, source, kind, kpi;

-- Rule health view
CREATE MATERIALIZED VIEW ops_rule_health_v AS
SELECT 
    r.id,
    r.company_id,
    r.name,
    r.enabled,
    r.severity,
    rs.last_fired_at,
    rs.fire_count,
    rs.suppressed_count,
    rs.last_error,
    rs.last_error_at,
    CASE 
        WHEN rs.last_fired_at IS NULL THEN 'NEVER_FIRED'
        WHEN rs.last_fired_at < NOW() - INTERVAL '24 hours' THEN 'STALE'
        WHEN rs.last_error_at > NOW() - INTERVAL '1 hour' THEN 'ERROR'
        ELSE 'HEALTHY'
    END as health_status,
    CASE 
        WHEN rs.fire_count = 0 THEN 0
        ELSE (rs.suppressed_count::FLOAT / rs.fire_count::FLOAT) * 100
    END as suppression_rate
FROM ops_rule r
LEFT JOIN ops_rule_stat rs ON r.id = rs.rule_id
WHERE r.enabled = true;

-- Action SLO view
CREATE MATERIALIZED VIEW ops_action_slo_v AS
SELECT 
    fs.action_code,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN fs.status = 'OK' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN fs.status = 'FAILED' THEN 1 END) as failed_executions,
    AVG(fs.duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fs.duration_ms) as p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY fs.duration_ms) as p95_duration_ms,
    CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(CASE WHEN fs.status = 'OK' THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100
    END as success_rate,
    MAX(fs.executed_at) as last_execution
FROM ops_fire_step fs
WHERE fs.executed_at >= NOW() - INTERVAL '7 days'
GROUP BY fs.action_code;

-- Indexes for materialized views
CREATE INDEX idx_ops_signal_recent_v_company_source ON ops_signal_recent_v(company_id, source);
CREATE INDEX idx_ops_rule_health_v_company_health ON ops_rule_health_v(company_id, health_status);
CREATE INDEX idx_ops_action_slo_v_action_code ON ops_action_slo_v(action_code);

-- Refresh functions
CREATE OR REPLACE FUNCTION refresh_ops_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ops_signal_recent_v;
    REFRESH MATERIALIZED VIEW CONCURRENTLY ops_rule_health_v;
    REFRESH MATERIALIZED VIEW CONCURRENTLY ops_action_slo_v;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW ops_signal_recent_v IS 'Recent signals aggregated by company, source, kind, and KPI';
COMMENT ON MATERIALIZED VIEW ops_rule_health_v IS 'Rule health status with firing statistics and error tracking';
COMMENT ON MATERIALIZED VIEW ops_action_slo_v IS 'Action SLO metrics with success rates and duration percentiles';
COMMENT ON FUNCTION refresh_ops_views() IS 'Refresh all OpsCC materialized views concurrently';
