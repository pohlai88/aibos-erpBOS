-- M26.9: ITGC & UAR Bridge - Event Outbox
-- Migration: 0278_itgc_outbox.sql

-- Insert ITGC-specific event types into outbox
INSERT INTO outbox_event_type (id, event_type_id, description) VALUES
-- UAR Campaign events
('uar_opened', 'uar_opened', 'UAR campaign opened for certification'),
('uar_escalated', 'uar_escalated', 'UAR campaign escalated due to overdue items'),
('uar_closed', 'uar_closed', 'UAR campaign closed with evidence pack'),
('uar_item_decided', 'uar_item_decided', 'UAR item certification decision made'),

-- SoD events
('sod_violation_found', 'sod_violation_found', 'SoD violation detected by rule engine'),
('sod_violation_waived', 'sod_violation_waived', 'SoD violation waived with justification'),
('sod_violation_resolved', 'sod_violation_resolved', 'SoD violation resolved'),

-- Break-glass events
('breakglass_opened', 'breakglass_opened', 'Break-glass emergency access opened'),
('breakglass_expired', 'breakglass_expired', 'Break-glass emergency access expired'),
('breakglass_closed', 'breakglass_closed', 'Break-glass emergency access manually closed'),

-- Evidence events
('itgc_snapshot_taken', 'itgc_snapshot_taken', 'ITGC snapshot taken for audit evidence'),
('uar_pack_built', 'uar_pack_built', 'UAR evidence pack built and stored'),

-- Connector events
('connector_run_started', 'connector_run_started', 'Connector data ingestion started'),
('connector_run_completed', 'connector_run_completed', 'Connector data ingestion completed'),
('connector_run_failed', 'connector_run_failed', 'Connector data ingestion failed')
ON CONFLICT (event_type_id) DO UPDATE SET
  description = EXCLUDED.description;

-- Comments for documentation
COMMENT ON TABLE outbox_event_type IS 'ITGC event types for UAR, SoD, break-glass, evidence, and connectors';
COMMENT ON EVENT 'uar_opened' IS 'UAR campaign opened for certification';
COMMENT ON EVENT 'uar_escalated' IS 'UAR campaign escalated due to overdue items';
COMMENT ON EVENT 'uar_closed' IS 'UAR campaign closed with evidence pack';
COMMENT ON EVENT 'sod_violation_found' IS 'SoD violation detected by rule engine';
COMMENT ON EVENT 'breakglass_opened' IS 'Break-glass emergency access opened';
COMMENT ON EVENT 'itgc_snapshot_taken' IS 'ITGC snapshot taken for audit evidence';
