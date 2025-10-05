-- M27.1: Real-Time Signals & Auto-Playbooks - Seed Prebuilt Rules & Playbooks
-- Migration: 0289_ops_seed_prebuilt.sql

-- Insert built-in action registry entries
INSERT INTO ops_action_registry (code, description, caps_required, dry_run_supported, payload_schema) VALUES
('AR.DUNNING.RUN', 'Run AR dunning process for selected customers', ARRAY['ar:dunning:execute'], true, '{"customer_segments": "array", "dry_run": "boolean"}'),
('AP.PAYRUN.RESEQUENCE', 'Resequence AP payment run with new priorities', ARRAY['ap:payrun:admin'], true, '{"payment_run_id": "string", "new_priorities": "array"}'),
('FX.REVAL.DRY_RUN', 'Run FX revaluation in dry-run mode', ARRAY['fx:reval:execute'], true, '{"as_of_date": "string", "currencies": "array"}'),
('CLOSE.ACCRUAL.DRAFT', 'Create accrual draft entries', ARRAY['close:accrual:create'], true, '{"period": "string", "accounts": "array"}'),
('CTRL.INCIDENT.OPEN', 'Open control incident for investigation', ARRAY['ctrl:incident:create'], true, '{"control_id": "string", "severity": "string", "description": "string"}'),
('CASH.ALERTS.TEST', 'Test cash alert system', ARRAY['cash:alerts:test'], true, '{"test_scenarios": "array"}')
ON CONFLICT (code) DO NOTHING;

-- Insert prebuilt playbooks
INSERT INTO ops_playbook (id, company_id, name, steps, max_blast_radius, dry_run_default, require_dual_control, timeout_sec, created_by, updated_by) VALUES
-- Liquidity breach playbook
('550e8400-e29b-41d4-a716-446655440001', 'default', 'Liquidity Breach Response', 
 '[{"action_code": "AR.DUNNING.RUN", "payload": {"customer_segments": ["top_debtors"], "dry_run": true}, "when": "always", "on_error": "CONTINUE"}, {"action_code": "AP.PAYRUN.RESEQUENCE", "payload": {"payment_run_id": "current", "new_priorities": ["defer_low_priority"]}, "when": "always", "on_error": "STOP"}]',
 50, true, true, 300, 'system', 'system'),

-- Collections stall playbook  
('550e8400-e29b-41d4-a716-446655440002', 'default', 'Collections Stall Response',
 '[{"action_code": "AR.DUNNING.RUN", "payload": {"customer_segments": ["stalled_segments"], "dry_run": false}, "when": "always", "on_error": "CONTINUE"}, {"action_code": "CTRL.INCIDENT.OPEN", "payload": {"control_id": "AR_COLLECTIONS", "severity": "HIGH", "description": "Collections stall detected"}, "when": "always", "on_error": "STOP"}]',
 100, true, false, 180, 'system', 'system'),

-- FX exposure spike playbook
('550e8400-e29b-41d4-a716-446655440003', 'default', 'FX Exposure Spike Response',
 '[{"action_code": "FX.REVAL.DRY_RUN", "payload": {"as_of_date": "current", "currencies": ["all"]}, "when": "always", "on_error": "STOP"}]',
 25, true, true, 120, 'system', 'system'),

-- Close control failure playbook
('550e8400-e29b-41d4-a716-446655440004', 'default', 'Close Control Failure Response',
 '[{"action_code": "CTRL.INCIDENT.OPEN", "payload": {"control_id": "JE_CONTINUITY", "severity": "CRITICAL", "description": "Control failure detected"}, "when": "always", "on_error": "STOP"}, {"action_code": "CLOSE.ACCRUAL.DRAFT", "payload": {"period": "current", "accounts": ["affected_accounts"]}, "when": "always", "on_error": "CONTINUE"}]',
 200, true, true, 600, 'system', 'system'),

-- AP run failure playbook
('550e8400-e29b-41d4-a716-446655440005', 'default', 'AP Run Failure Response',
 '[{"action_code": "AP.PAYRUN.RESEQUENCE", "payload": {"payment_run_id": "failed_run", "new_priorities": ["retry_failed"]}, "when": "always", "on_error": "RETRY", "retry": {"max_attempts": 3, "backoff_ms": 5000}}, {"action_code": "CTRL.INCIDENT.OPEN", "payload": {"control_id": "AP_PROCESSING", "severity": "MEDIUM", "description": "AP run failure requires attention"}, "when": "always", "on_error": "STOP"}]',
 75, true, false, 240, 'system', 'system'),

-- Cash alert SLA miss playbook
('550e8400-e29b-41d4-a716-446655440006', 'default', 'Cash Alert SLA Miss Response',
 '[{"action_code": "CASH.ALERTS.TEST", "payload": {"test_scenarios": ["sla_miss"]}, "when": "always", "on_error": "STOP"}]',
 10, true, false, 60, 'system', 'system')
ON CONFLICT (id) DO NOTHING;

-- Insert prebuilt rules
INSERT INTO ops_rule (id, company_id, name, enabled, severity, when_expr, window_sec, threshold, throttle_sec, approvals, action_playbook_id, updated_by) VALUES
-- Liquidity breach rule
('660e8400-e29b-41d4-a716-446655440001', 'default', 'Liquidity Breach Detection', false, 'CRITICAL',
 '{"all": [{"kpi": "CF_13WEEK_NET", "op": "<", "value": 0, "agg": "avg", "window_sec": 1209600}, {"kpi": "BANK_BAL", "op": "<", "value": 100000, "agg": "min", "window_sec": 1209600}]}',
 1209600, '{"CF_13WEEK_NET": 0, "BANK_BAL": 100000}', 3600, 1, '550e8400-e29b-41d4-a716-446655440001', 'system'),

-- Collections stall rule
('660e8400-e29b-41d4-a716-446655440002', 'default', 'Collections Stall Detection', false, 'HIGH',
 '{"all": [{"kpi": "PTP_BROKEN_RATE", "op": ">", "value": 7, "agg": "avg", "window_sec": 1209600}, {"kpi": "DSO_DELTA", "op": ">", "value": 3, "agg": "max", "window_sec": 1209600}]}',
 1209600, '{"PTP_BROKEN_RATE": 7, "DSO_DELTA": 3}', 3600, 0, '550e8400-e29b-41d4-a716-446655440002', 'system'),

-- FX exposure spike rule
('660e8400-e29b-41d4-a716-446655440003', 'default', 'FX Exposure Spike Detection', false, 'HIGH',
 '{"kpi": "OPEN_FX_NET", "op": "abs_gt", "value": 50000, "agg": "max", "window_sec": 3600}',
 3600, '{"OPEN_FX_NET": 50000}', 1800, 1, '550e8400-e29b-41d4-a716-446655440003', 'system'),

-- Close control failure rule
('660e8400-e29b-41d4-a716-446655440004', 'default', 'Close Control Failure Detection', false, 'CRITICAL',
 '{"kpi": "JE_CONTINUITY_FAIL", "op": ">=", "value": 2, "agg": "count", "window_sec": 86400}',
 86400, '{"JE_CONTINUITY_FAIL": 2}', 7200, 1, '550e8400-e29b-41d4-a716-446655440004', 'system'),

-- AP run failure rule
('660e8400-e29b-41d4-a716-446655440005', 'default', 'AP Run Failure Detection', false, 'MEDIUM',
 '{"kpi": "AP_RUN_REJECT_RATE", "op": ">", "value": 5, "agg": "avg", "window_sec": 3600}',
 3600, '{"AP_RUN_REJECT_RATE": 5}', 1800, 0, '550e8400-e29b-41d4-a716-446655440005', 'system'),

-- Cash alert SLA miss rule
('660e8400-e29b-41d4-a716-446655440006', 'default', 'Cash Alert SLA Miss Detection', false, 'MEDIUM',
 '{"kpi": "CASH_ALERT_DELAY", "op": ">", "value": 10, "agg": "max", "window_sec": 3600}',
 3600, '{"CASH_ALERT_DELAY": 10}', 3600, 0, '550e8400-e29b-41d4-a716-446655440006', 'system')
ON CONFLICT (id) DO NOTHING;

-- Initialize rule statistics
INSERT INTO ops_rule_stat (rule_id, fire_count, suppressed_count) VALUES
('660e8400-e29b-41d4-a716-446655440001', 0, 0),
('660e8400-e29b-41d4-a716-446655440002', 0, 0),
('660e8400-e29b-41d4-a716-446655440003', 0, 0),
('660e8400-e29b-41d4-a716-446655440004', 0, 0),
('660e8400-e29b-41d4-a716-446655440005', 0, 0),
('660e8400-e29b-41d4-a716-446655440006', 0, 0)
ON CONFLICT (rule_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE ops_action_registry IS 'Built-in action registry with 6 pre-configured actions';
COMMENT ON TABLE ops_playbook IS '6 prebuilt playbooks for common operational scenarios';
COMMENT ON TABLE ops_rule IS '6 prebuilt rules for automated detection (all disabled by default)';
COMMENT ON TABLE ops_rule_stat IS 'Initialized statistics for all prebuilt rules';
