-- M27: Ops Command Center - Foreign Key Hardening
-- Migration: 0284_opscc_fk_hardening.sql

-- Add foreign key constraints for referential integrity

-- Board config foreign keys
ALTER TABLE board_config ADD CONSTRAINT fk_board_config_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- KPI tile config foreign keys
ALTER TABLE kpi_tile_config ADD CONSTRAINT fk_kpi_tile_config_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Alert rule foreign keys
ALTER TABLE alert_rule ADD CONSTRAINT fk_alert_rule_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Alert event foreign keys
ALTER TABLE alert_event ADD CONSTRAINT fk_alert_event_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE alert_event ADD CONSTRAINT fk_alert_event_rule 
  FOREIGN KEY (rule_id) REFERENCES alert_rule(id) ON DELETE CASCADE;
ALTER TABLE alert_event ADD CONSTRAINT fk_alert_event_snapshot 
  FOREIGN KEY (snapshot_id) REFERENCES kpi_snapshot(id) ON DELETE SET NULL;
ALTER TABLE alert_event ADD CONSTRAINT fk_alert_event_action 
  FOREIGN KEY (action_suggestion_id) REFERENCES playbook_action(id) ON DELETE SET NULL;

-- What-if scenario foreign keys
ALTER TABLE whatif_scenario ADD CONSTRAINT fk_whatif_scenario_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- KPI refresh log foreign keys
ALTER TABLE kpi_refresh_log ADD CONSTRAINT fk_kpi_refresh_log_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Comments for documentation
COMMENT ON CONSTRAINT fk_board_config_company ON board_config IS 'Ensures board configs belong to valid companies';
COMMENT ON CONSTRAINT fk_kpi_tile_config_company ON kpi_tile_config IS 'Ensures KPI tile configs belong to valid companies';
COMMENT ON CONSTRAINT fk_alert_rule_company ON alert_rule IS 'Ensures alert rules belong to valid companies';
COMMENT ON CONSTRAINT fk_alert_event_company ON alert_event IS 'Ensures alert events belong to valid companies';
COMMENT ON CONSTRAINT fk_alert_event_rule ON alert_event IS 'Ensures alert events reference valid rules';
COMMENT ON CONSTRAINT fk_alert_event_snapshot ON alert_event IS 'Ensures alert events reference valid snapshots';
COMMENT ON CONSTRAINT fk_alert_event_action ON alert_event IS 'Ensures alert events reference valid actions';
COMMENT ON CONSTRAINT fk_whatif_scenario_company ON whatif_scenario IS 'Ensures what-if scenarios belong to valid companies';
COMMENT ON CONSTRAINT fk_kpi_refresh_log_company ON kpi_refresh_log IS 'Ensures refresh logs belong to valid companies';
