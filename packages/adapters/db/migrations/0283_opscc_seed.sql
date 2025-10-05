-- M27: Ops Command Center - Seed Data
-- Migration: 0283_opscc_seed.sql

-- Insert default board configurations
INSERT INTO board_config (company_id, board, name, description, default_present_ccy, layout, acl) VALUES
('default', 'EXEC', 'Executive Dashboard', 'CFO executive dashboard with liquidity, cash burn, and close metrics', 'USD', 
 '{"columns": 3, "rows": 2}', '{"roles": ["admin", "finance_manager"]}'),
('default', 'TREASURY', 'Treasury Operations', 'Treasury operations dashboard with payments, discounts, and FX exposure', 'USD',
 '{"columns": 2, "rows": 2}', '{"roles": ["admin", "treasury_ops", "finance_manager"]}'),
('default', 'AR', 'Accounts Receivable', 'AR collections dashboard with aging, PTP, and dunning metrics', 'USD',
 '{"columns": 2, "rows": 2}', '{"roles": ["admin", "accountant", "finance_manager"]}'),
('default', 'CLOSE', 'Close & Controls', 'Month-end close and controls dashboard', 'USD',
 '{"columns": 2, "rows": 2}', '{"roles": ["admin", "accountant", "finance_manager"]}');

-- Insert default KPI tile configurations for Executive Board
INSERT INTO kpi_tile_config (company_id, board, tile_id, kpi, viz, format, targets, order_no) VALUES
('default', 'EXEC', 'liquidity_runway', 'LIQUIDITY_RUNWAY_W', 'NUMBER', 'weeks', '{"target": 12, "warning": 8, "critical": 4}', 1),
('default', 'EXEC', 'cash_burn', 'CASH_BURN_4W', 'DELTA', 'currency', '{"target": 0, "warning": -100000, "critical": -500000}', 2),
('default', 'EXEC', 'forecast_accuracy', 'FORECAST_ACCURACY_CASH_30D', 'NUMBER', 'percentage', '{"target": 95, "warning": 85, "critical": 75}', 3),
('default', 'EXEC', 'dso_dpo_ccc', 'DSO_DPO_CCC', 'TABLE', 'days', '{"dso_target": 30, "dpo_target": 45, "ccc_target": 15}', 4),
('default', 'EXEC', 'close_progress', 'CLOSE_PROGRESS', 'NUMBER', 'percentage', '{"target": 100, "warning": 80, "critical": 60}', 5),
('default', 'EXEC', 'control_pass_rate', 'CONTROL_PASS_RATE', 'NUMBER', 'percentage', '{"target": 95, "warning": 90, "critical": 85}', 6),
('default', 'EXEC', 'uar_completion', 'UAR_COMPLETION', 'NUMBER', 'percentage', '{"target": 100, "warning": 90, "critical": 80}', 7);

-- Insert default KPI tile configurations for Treasury Board
INSERT INTO kpi_tile_config (company_id, board, tile_id, kpi, viz, format, targets, order_no) VALUES
('default', 'TREASURY', 'pay_commit_14d', 'PAY_RUN_COMMIT_14D', 'NUMBER', 'currency', '{"target": 0, "warning": 1000000, "critical": 5000000}', 1),
('default', 'TREASURY', 'discount_capture', 'DISCOUNT_CAPTURE_RATE', 'NUMBER', 'percentage', '{"target": 80, "warning": 60, "critical": 40}', 2),
('default', 'TREASURY', 'bank_ack_lag', 'BANK_ACK_LAG_H', 'NUMBER', 'hours', '{"target": 2, "warning": 8, "critical": 24}', 3),
('default', 'TREASURY', 'fx_exposure', 'FX_EXPOSURE_BY_CCY', 'TABLE', 'currency', '{"target": 0, "warning": 100000, "critical": 500000}', 4);

-- Insert default KPI tile configurations for AR Board
INSERT INTO kpi_tile_config (company_id, board, tile_id, kpi, viz, format, targets, order_no) VALUES
('default', 'AR', 'ptp_at_risk', 'PTP_AT_RISK', 'NUMBER', 'currency', '{"target": 0, "warning": 50000, "critical": 200000}', 1),
('default', 'AR', 'ptp_kept_rate', 'PTP_KEPT_RATE', 'NUMBER', 'percentage', '{"target": 90, "warning": 75, "critical": 60}', 2),
('default', 'AR', 'dunning_hit_rate', 'DUNNING_HIT_RATE', 'NUMBER', 'percentage', '{"target": 80, "warning": 60, "critical": 40}', 3),
('default', 'AR', 'auto_match_rate', 'AUTO_MATCH_RATE', 'NUMBER', 'percentage', '{"target": 95, "warning": 85, "critical": 70}', 4),
('default', 'AR', 'slippage_vs_promise', 'SLIPPAGE_VS_PROMISE', 'NUMBER', 'percentage', '{"target": 0, "warning": 10, "critical": 25}', 5);

-- Insert default KPI tile configurations for Close Board
INSERT INTO kpi_tile_config (company_id, board, tile_id, kpi, viz, format, targets, order_no) VALUES
('default', 'CLOSE', 'accrual_coverage', 'ACCRUAL_COVERAGE', 'NUMBER', 'percentage', '{"target": 100, "warning": 90, "critical": 80}', 1),
('default', 'CLOSE', 'flux_comment_completion', 'FLUX_COMMENT_COMPLETION', 'NUMBER', 'percentage', '{"target": 100, "warning": 90, "critical": 80}', 2),
('default', 'CLOSE', 'evidence_freshness', 'EVIDENCE_FRESHNESS', 'NUMBER', 'hours', '{"target": 24, "warning": 72, "critical": 168}', 3),
('default', 'CLOSE', 'sox_status', 'SOX_STATUS', 'NUMBER', 'percentage', '{"target": 100, "warning": 95, "critical": 90}', 4),
('default', 'CLOSE', 'exceptions_open', 'EXCEPTIONS_OPEN', 'NUMBER', 'count', '{"target": 0, "warning": 5, "critical": 15}', 5);

-- Insert default playbook actions
INSERT INTO playbook_action (action_id, name, description, parameter_schema, required_capability) VALUES
('PAYRUN_DISPATCH', 'Dispatch Payment Run', 'Execute payment run with specified parameters', 
 '{"type": "object", "properties": {"run_id": {"type": "string"}, "dry_run": {"type": "boolean"}}, "required": ["run_id"]}', 'pay:dispatch'),
('RUN_DUNNING', 'Run Dunning Process', 'Execute dunning process for overdue accounts', 
 '{"type": "object", "properties": {"policy_code": {"type": "string"}, "segment": {"type": "string"}, "dry_run": {"type": "boolean"}}, "required": ["policy_code", "segment"]}', 'ar:dunning:run'),
('FX_REVALUE', 'FX Revaluation', 'Execute FX revaluation for specified period', 
 '{"type": "object", "properties": {"year": {"type": "integer"}, "month": {"type": "integer"}, "ccy_pairs": {"type": "array"}, "dry_run": {"type": "boolean"}}, "required": ["year", "month", "ccy_pairs"]}', 'fx:manage'),
('ACCELERATE_COLLECTIONS', 'Accelerate Collections', 'Escalate collections for at-risk accounts', 
 '{"type": "object", "properties": {"customer_ids": {"type": "array"}, "escalation_level": {"type": "string"}}, "required": ["customer_ids", "escalation_level"]}', 'ar:collections:manage');

-- Insert default alert rules
INSERT INTO alert_rule (company_id, board, kpi, rule_id, expr, severity, throttle_sec) VALUES
('default', 'EXEC', 'LIQUIDITY_RUNWAY_W', 'liquidity_runway_low', 'value < 6', 'HIGH', 3600),
('default', 'EXEC', 'FORECAST_ACCURACY_CASH_30D', 'forecast_accuracy_low', 'value < 85', 'MED', 7200),
('default', 'CLOSE', 'CONTROL_PASS_RATE', 'control_pass_rate_low', 'value < 95', 'HIGH', 1800);

-- Comments for documentation
COMMENT ON TABLE board_config IS 'Default board configurations for all companies';
COMMENT ON TABLE kpi_tile_config IS 'Default KPI tile configurations for all boards';
COMMENT ON TABLE playbook_action IS 'Default playbook actions available for alerts';
COMMENT ON TABLE alert_rule IS 'Default alert rules for critical KPIs';
