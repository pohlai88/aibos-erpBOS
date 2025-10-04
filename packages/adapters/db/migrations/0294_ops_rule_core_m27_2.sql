-- M27.2: OpsCC Playbook Studio + Guarded Autonomy - Core Tables
-- Migration: 0294_ops_rule_core_m27_2.sql

-- ops_rule — rule metadata & schedule
CREATE TABLE ops_rule (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('alert', 'periodic', 'manual')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    source TEXT, -- signal bus selector
    where_jsonb JSONB, -- filter
    schedule_cron TEXT, -- cron expression for periodic rules
    priority INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ops_playbook — versioned playbook definition
CREATE TABLE ops_playbook (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
    latest_version INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ops_playbook_version — immutable versions
CREATE TABLE ops_playbook_version (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    playbook_id TEXT NOT NULL REFERENCES ops_playbook(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    spec_jsonb JSONB NOT NULL, -- steps, guards, approvals, canary
    hash TEXT NOT NULL, -- content hash for idempotency
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(playbook_id, version)
);

-- ops_guard_policy — guardrails at company/playbook scope
CREATE TABLE ops_guard_policy (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    scope TEXT NOT NULL, -- 'global' or 'playbook:<code>'
    max_concurrent INTEGER NOT NULL DEFAULT 1,
    blast_radius JSONB, -- allowed entity counts, % thresholds
    requires_dual_control BOOLEAN NOT NULL DEFAULT false,
    canary JSONB, -- sample %, min N
    rollback_policy JSONB, -- how to revert
    timeout_sec INTEGER NOT NULL DEFAULT 900,
    cooldown_sec INTEGER NOT NULL DEFAULT 3600,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- ops_run — execution header
CREATE TABLE ops_run (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    rule_id TEXT REFERENCES ops_rule(id),
    playbook_version_id TEXT NOT NULL REFERENCES ops_playbook_version(id),
    trigger TEXT NOT NULL CHECK (trigger IN ('cron', 'signal', 'manual', 'canary')),
    status TEXT NOT NULL CHECK (status IN ('queued', 'approved', 'running', 'rolled_back', 'succeeded', 'failed', 'cancelled', 'cooling_down')) DEFAULT 'queued',
    canary BOOLEAN NOT NULL DEFAULT false,
    scope_jsonb JSONB, -- entities impacted
    blast_radius_eval JSONB, -- evaluation results
    approvals_jsonb JSONB, -- approval tracking
    metrics_jsonb JSONB, -- execution metrics
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ops_run_step — step-by-step execution
CREATE TABLE ops_run_step (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_id TEXT NOT NULL REFERENCES ops_run(id) ON DELETE CASCADE,
    idx INTEGER NOT NULL,
    action_code TEXT NOT NULL,
    input_jsonb JSONB NOT NULL,
    output_jsonb JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'rolled_back')) DEFAULT 'pending',
    duration_ms INTEGER,
    rolled_back BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ops_rollback_step — mirrors steps for revert
CREATE TABLE ops_rollback_step (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_step_id TEXT NOT NULL REFERENCES ops_run_step(id) ON DELETE CASCADE,
    action_code TEXT NOT NULL,
    input_jsonb JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed')) DEFAULT 'pending',
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ops_outbox — event stream (append-only)
CREATE TABLE ops_outbox (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    topic TEXT NOT NULL,
    key TEXT NOT NULL,
    payload_jsonb JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ops_cap — capability grants for playbook codes (for fine-grain approvals)
CREATE TABLE ops_cap (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    playbook_code TEXT NOT NULL,
    capability TEXT NOT NULL CHECK (capability IN ('ops:playbook:approve', 'ops:playbook:execute', 'ops:run:read')),
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, playbook_code, capability, role)
);

-- Indexes for performance
CREATE INDEX idx_ops_run_company_status_started ON ops_run(company_id, status, started_at DESC);
CREATE INDEX idx_ops_rule_company_enabled_priority ON ops_rule(company_id, enabled, priority DESC);
CREATE INDEX idx_ops_playbook_version_playbook_version ON ops_playbook_version(playbook_id, version DESC);
CREATE INDEX idx_ops_outbox_topic_created ON ops_outbox(topic, created_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_ops_rule_where_jsonb ON ops_rule USING GIN (where_jsonb);
CREATE INDEX idx_ops_playbook_version_spec_jsonb ON ops_playbook_version USING GIN (spec_jsonb);
CREATE INDEX idx_ops_run_scope_jsonb ON ops_run USING GIN (scope_jsonb);
CREATE INDEX idx_ops_run_blast_radius_eval ON ops_run USING GIN (blast_radius_eval);
CREATE INDEX idx_ops_run_approvals_jsonb ON ops_run USING GIN (approvals_jsonb);
CREATE INDEX idx_ops_run_metrics_jsonb ON ops_run USING GIN (metrics_jsonb);
CREATE INDEX idx_ops_run_step_input_jsonb ON ops_run_step USING GIN (input_jsonb);
CREATE INDEX idx_ops_run_step_output_jsonb ON ops_run_step USING GIN (output_jsonb);
CREATE INDEX idx_ops_rollback_step_input_jsonb ON ops_rollback_step USING GIN (input_jsonb);
CREATE INDEX idx_ops_outbox_payload_jsonb ON ops_outbox USING GIN (payload_jsonb);
CREATE INDEX idx_ops_guard_policy_blast_radius ON ops_guard_policy USING GIN (blast_radius);
CREATE INDEX idx_ops_guard_policy_canary ON ops_guard_policy USING GIN (canary);
CREATE INDEX idx_ops_guard_policy_rollback_policy ON ops_guard_policy USING GIN (rollback_policy);

-- Comments for documentation
COMMENT ON TABLE ops_rule IS 'Rule metadata & schedule for M27.2 Playbook Studio';
COMMENT ON TABLE ops_playbook IS 'Versioned playbook definition with git-like history';
COMMENT ON TABLE ops_playbook_version IS 'Immutable playbook versions with spec and hash';
COMMENT ON TABLE ops_guard_policy IS 'Guardrails at company/playbook scope for safety';
COMMENT ON TABLE ops_run IS 'Execution header with status and metrics tracking';
COMMENT ON TABLE ops_run_step IS 'Step-by-step execution with input/output tracking';
COMMENT ON TABLE ops_rollback_step IS 'Rollback steps for safe revert operations';
COMMENT ON TABLE ops_outbox IS 'Event stream for observability and audit trail';
COMMENT ON TABLE ops_cap IS 'Fine-grained capability grants per playbook code';
