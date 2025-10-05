-- M27.1: Real-Time Signals & Auto-Playbooks - Rule Core Tables
-- Migration: 0281_ops_rule_core.sql

-- Rule definition table
CREATE TABLE ops_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    severity TEXT NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    when_expr JSONB NOT NULL,               -- rule condition expression
    window_sec INTEGER NOT NULL DEFAULT 3600, -- evaluation window in seconds
    threshold JSONB NOT NULL,               -- threshold configuration
    throttle_sec INTEGER NOT NULL DEFAULT 3600, -- minimum time between fires
    approvals INTEGER NOT NULL DEFAULT 0,  -- required approvals for execution
    action_playbook_id UUID,               -- playbook to execute
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CHECK (window_sec > 0),
    CHECK (throttle_sec >= 0),
    CHECK (approvals >= 0)
);

-- Rule execution statistics
CREATE TABLE ops_rule_stat (
    rule_id UUID PRIMARY KEY REFERENCES ops_rule(id) ON DELETE CASCADE,
    last_fired_at TIMESTAMPTZ,
    fire_count INTEGER NOT NULL DEFAULT 0,
    suppressed_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ops_rule_company_enabled ON ops_rule(company_id, enabled);
CREATE INDEX idx_ops_rule_company_severity ON ops_rule(company_id, severity);
CREATE INDEX idx_ops_rule_updated_at ON ops_rule(updated_at);
CREATE INDEX idx_ops_rule_stat_last_fired ON ops_rule_stat(last_fired_at) WHERE last_fired_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE ops_rule IS 'Rule definitions for OpsCC signal processing';
COMMENT ON COLUMN ops_rule.when_expr IS 'JSON expression defining rule conditions';
COMMENT ON COLUMN ops_rule.window_sec IS 'Evaluation window in seconds';
COMMENT ON COLUMN ops_rule.threshold IS 'Threshold configuration for rule triggers';
COMMENT ON COLUMN ops_rule.throttle_sec IS 'Minimum seconds between rule fires';
COMMENT ON COLUMN ops_rule.approvals IS 'Required approvals before execution';
COMMENT ON COLUMN ops_rule.action_playbook_id IS 'Playbook to execute when rule fires';
COMMENT ON TABLE ops_rule_stat IS 'Rule execution statistics and health monitoring';
