-- M27: Ops Command Center - Performance Indexes
-- Migration: 0287_opscc_perf_idx.sql

-- Additional performance indexes for OpsCC tables

-- KPI snapshot indexes for time-series queries
CREATE INDEX idx_kpi_snapshot_company_ts ON kpi_snapshot(company_id, ts_utc DESC);
CREATE INDEX idx_kpi_snapshot_board_ts ON kpi_snapshot(board, ts_utc DESC);
CREATE INDEX idx_kpi_snapshot_kpi_ts ON kpi_snapshot(kpi, ts_utc DESC);

-- Board config indexes
CREATE INDEX idx_board_config_board_name ON board_config(board, name);

-- KPI tile config indexes
CREATE INDEX idx_kpi_tile_config_kpi ON kpi_tile_config(kpi);
CREATE INDEX idx_kpi_tile_config_viz ON kpi_tile_config(viz);

-- Alert rule indexes
CREATE INDEX idx_alert_rule_kpi_enabled ON alert_rule(kpi, enabled);
CREATE INDEX idx_alert_rule_severity ON alert_rule(severity);
CREATE INDEX idx_alert_rule_last_fired ON alert_rule(last_fired_at);

-- Alert event indexes
CREATE INDEX idx_alert_event_board_kpi ON alert_event(board, kpi);
CREATE INDEX idx_alert_event_severity ON alert_event(severity);
CREATE INDEX idx_alert_event_fired_at_desc ON alert_event(fired_at DESC);
CREATE INDEX idx_alert_event_status_fired ON alert_event(status, fired_at);

-- Playbook action indexes
CREATE INDEX idx_playbook_action_capability ON playbook_action(required_capability);
CREATE INDEX idx_playbook_action_enabled ON playbook_action(enabled);

-- What-if scenario indexes
CREATE INDEX idx_whatif_scenario_scenario_id ON whatif_scenario(scenario_id);
CREATE INDEX idx_whatif_scenario_created_at ON whatif_scenario(created_at DESC);

-- Outbox indexes
CREATE INDEX idx_opscc_outbox_event_type ON opscc_outbox(event_type);
CREATE INDEX idx_opscc_outbox_created_at_desc ON opscc_outbox(created_at DESC);

-- Refresh log indexes
CREATE INDEX idx_kpi_refresh_log_mv_name ON kpi_refresh_log(mv_name);
CREATE INDEX idx_kpi_refresh_log_status ON kpi_refresh_log(status);
CREATE INDEX idx_kpi_refresh_log_refreshed_at_desc ON kpi_refresh_log(refreshed_at DESC);

-- Comments for documentation
COMMENT ON INDEX idx_kpi_snapshot_company_ts IS 'Time-series queries by company';
COMMENT ON INDEX idx_kpi_snapshot_board_ts IS 'Time-series queries by board';
COMMENT ON INDEX idx_kpi_snapshot_kpi_ts IS 'Time-series queries by KPI';
COMMENT ON INDEX idx_alert_event_fired_at_desc IS 'Recent alerts for dashboard';
COMMENT ON INDEX idx_whatif_scenario_created_at IS 'Recent what-if scenarios';
COMMENT ON INDEX idx_opscc_outbox_created_at_desc IS 'Recent outbox events';
COMMENT ON INDEX idx_kpi_refresh_log_refreshed_at_desc IS 'Recent refresh operations';
