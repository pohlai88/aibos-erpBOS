-- M27.1: Real-Time Signals & Auto-Playbooks - Firing Log Tables
-- Migration: 0283_ops_firing_log.sql

-- Rule firing events
CREATE TABLE ops_fire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    rule_id UUID NOT NULL REFERENCES ops_rule(id) ON DELETE CASCADE,
    window_from TIMESTAMPTZ NOT NULL,
    window_to TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,                  -- why the rule fired
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'EXECUTING', 'COMPLETED', 'FAILED', 'SUPPRESSED')),
    approvals_needed INTEGER NOT NULL DEFAULT 0,
    approvals_got INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CHECK (window_from <= window_to),
    CHECK (approvals_needed >= 0),
    CHECK (approvals_got >= 0),
    CHECK (approvals_got <= approvals_needed)
);

-- Individual playbook step executions
CREATE TABLE ops_fire_step (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fire_id UUID NOT NULL REFERENCES ops_fire(id) ON DELETE CASCADE,
    step_no INTEGER NOT NULL,
    action_code TEXT NOT NULL,
    dry_run BOOLEAN NOT NULL DEFAULT true,
    payload JSONB NOT NULL DEFAULT '{}',
    attempt INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OK', 'FAILED', 'RETRIED', 'SKIPPED')),
    duration_ms INTEGER,
    error_message TEXT,
    result JSONB,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CHECK (step_no > 0),
    CHECK (attempt > 0),
    CHECK (duration_ms >= 0)
);

-- Indexes for performance
CREATE INDEX idx_ops_fire_company_status ON ops_fire(company_id, status);
CREATE INDEX idx_ops_fire_rule_created ON ops_fire(rule_id, created_at);
CREATE INDEX idx_ops_fire_status_created ON ops_fire(status, created_at);
CREATE INDEX idx_ops_fire_step_fire_step ON ops_fire_step(fire_id, step_no);
CREATE INDEX idx_ops_fire_step_status ON ops_fire_step(status);
CREATE INDEX idx_ops_fire_step_action ON ops_fire_step(action_code);

-- Comments for documentation
COMMENT ON TABLE ops_fire IS 'Rule firing events with approval tracking';
COMMENT ON COLUMN ops_fire.window_from IS 'Start of evaluation window';
COMMENT ON COLUMN ops_fire.window_to IS 'End of evaluation window';
COMMENT ON COLUMN ops_fire.reason IS 'Human-readable reason for firing';
COMMENT ON COLUMN ops_fire.status IS 'Fire status: PENDING, APPROVED, EXECUTING, COMPLETED, FAILED, SUPPRESSED';
COMMENT ON TABLE ops_fire_step IS 'Individual playbook step executions with retry tracking';
COMMENT ON COLUMN ops_fire_step.step_no IS 'Step sequence number';
COMMENT ON COLUMN ops_fire_step.attempt IS 'Retry attempt number';
COMMENT ON COLUMN ops_fire_step.duration_ms IS 'Step execution duration in milliseconds';
