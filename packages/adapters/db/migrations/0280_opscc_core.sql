-- M27: Ops Command Center - Core Tables
-- Migration: 0280_opscc_core.sql

-- KPI snapshots for real-time dashboard
CREATE TABLE kpi_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  board TEXT NOT NULL CHECK (board IN ('EXEC', 'TREASURY', 'AR', 'CLOSE')),
  kpi TEXT NOT NULL,
  ts_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  value NUMERIC(28,6),
  num BIGINT,
  den BIGINT,
  meta JSONB,
  present_ccy CHAR(3) NOT NULL DEFAULT 'USD',
  basis TEXT NOT NULL CHECK (basis IN ('ACTUAL', 'FORECAST', 'BLENDED')) DEFAULT 'ACTUAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, board, kpi, ts_utc)
);

-- Board configurations
CREATE TABLE board_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  board TEXT NOT NULL CHECK (board IN ('EXEC', 'TREASURY', 'AR', 'CLOSE')),
  name TEXT NOT NULL,
  description TEXT,
  default_present_ccy CHAR(3) NOT NULL DEFAULT 'USD',
  layout JSONB,
  acl JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, board)
);

-- KPI tile configurations
CREATE TABLE kpi_tile_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  board TEXT NOT NULL CHECK (board IN ('EXEC', 'TREASURY', 'AR', 'CLOSE')),
  tile_id TEXT NOT NULL,
  kpi TEXT NOT NULL,
  viz TEXT NOT NULL CHECK (viz IN ('NUMBER', 'DELTA', 'SPARK', 'TABLE')),
  format TEXT,
  targets JSONB,
  order_no INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, board, tile_id)
);

-- Alert rules
CREATE TABLE alert_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  board TEXT NOT NULL CHECK (board IN ('EXEC', 'TREASURY', 'AR', 'CLOSE')),
  kpi TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  expr TEXT NOT NULL, -- CEL/JSON expression
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MED', 'HIGH', 'CRITICAL')),
  throttle_sec INTEGER NOT NULL DEFAULT 300, -- 5 minutes default
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, rule_id)
);

-- Playbook actions catalog
CREATE TABLE playbook_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parameter_schema JSONB NOT NULL,
  required_capability TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert events (fired alerts)
CREATE TABLE alert_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  rule_id UUID NOT NULL REFERENCES alert_rule(id) ON DELETE CASCADE,
  board TEXT NOT NULL CHECK (board IN ('EXEC', 'TREASURY', 'AR', 'CLOSE')),
  kpi TEXT NOT NULL,
  snapshot_id UUID REFERENCES kpi_snapshot(id),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MED', 'HIGH', 'CRITICAL')),
  message TEXT NOT NULL,
  action_suggestion_id UUID REFERENCES playbook_action(id),
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'ACK', 'RESOLVED')) DEFAULT 'OPEN',
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acked_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- What-if scenarios
CREATE TABLE whatif_scenario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  board TEXT NOT NULL CHECK (board IN ('EXEC', 'TREASURY', 'AR', 'CLOSE')),
  scenario_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  params JSONB NOT NULL,
  baseline_at TIMESTAMPTZ NOT NULL,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, scenario_id)
);

-- Performance indexes
CREATE INDEX idx_kpi_snapshot_company_board_kpi ON kpi_snapshot(company_id, board, kpi, ts_utc DESC);
CREATE INDEX idx_kpi_snapshot_ts_utc ON kpi_snapshot(ts_utc);
CREATE INDEX idx_kpi_snapshot_board ON kpi_snapshot(board);

CREATE INDEX idx_board_config_company ON board_config(company_id);
CREATE INDEX idx_board_config_board ON board_config(board);

CREATE INDEX idx_kpi_tile_config_company_board ON kpi_tile_config(company_id, board);
CREATE INDEX idx_kpi_tile_config_order ON kpi_tile_config(order_no);

CREATE INDEX idx_alert_rule_company ON alert_rule(company_id);
CREATE INDEX idx_alert_rule_board_kpi ON alert_rule(board, kpi);
CREATE INDEX idx_alert_rule_enabled ON alert_rule(enabled);

CREATE INDEX idx_alert_event_company ON alert_event(company_id);
CREATE INDEX idx_alert_event_rule ON alert_event(rule_id);
CREATE INDEX idx_alert_event_status ON alert_event(status);
CREATE INDEX idx_alert_event_fired_at ON alert_event(fired_at);

CREATE INDEX idx_whatif_scenario_company ON whatif_scenario(company_id);
CREATE INDEX idx_whatif_scenario_board ON whatif_scenario(board);

-- Comments for documentation
COMMENT ON TABLE kpi_snapshot IS 'Real-time KPI snapshots for dashboard tiles';
COMMENT ON TABLE board_config IS 'Dashboard board configurations and layouts';
COMMENT ON TABLE kpi_tile_config IS 'KPI tile definitions and visualization settings';
COMMENT ON TABLE alert_rule IS 'Alert rules with CEL expressions for KPI monitoring';
COMMENT ON TABLE playbook_action IS 'Catalog of executable actions for playbooks';
COMMENT ON TABLE alert_event IS 'Fired alert events with suggested actions';
COMMENT ON TABLE whatif_scenario IS 'Saved what-if simulation scenarios';

COMMENT ON COLUMN kpi_snapshot.board IS 'Dashboard board: EXEC, TREASURY, AR, CLOSE';
COMMENT ON COLUMN kpi_snapshot.kpi IS 'KPI code identifier';
COMMENT ON COLUMN kpi_snapshot.basis IS 'Data basis: ACTUAL, FORECAST, BLENDED';
COMMENT ON COLUMN alert_rule.expr IS 'CEL/JSON expression for alert evaluation';
COMMENT ON COLUMN alert_rule.throttle_sec IS 'Minimum seconds between alert firings';
COMMENT ON COLUMN playbook_action.parameter_schema IS 'JSON schema for action parameters';
COMMENT ON COLUMN playbook_action.required_capability IS 'RBAC capability required to execute';
