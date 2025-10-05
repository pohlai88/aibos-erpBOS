-- M27.2: OpsCC Playbook Studio + Guarded Autonomy
-- Visual rule/playbook editor with versioning, dry-run sandboxes, and blast-radius caps

-- Playbook versions for git-like history
CREATE TABLE ops_playbook_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    playbook_id UUID NOT NULL REFERENCES ops_playbook(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',
    max_blast_radius INTEGER NOT NULL DEFAULT 100,
    dry_run_default BOOLEAN NOT NULL DEFAULT true,
    require_dual_control BOOLEAN NOT NULL DEFAULT false,
    timeout_sec INTEGER NOT NULL DEFAULT 300,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT false,
    change_summary TEXT,
    UNIQUE(company_id, playbook_id, version_no)
);

-- Rule versions for git-like history  
CREATE TABLE ops_rule_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    rule_id UUID NOT NULL REFERENCES ops_rule(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    severity TEXT NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    when_expr JSONB NOT NULL,
    window_sec INTEGER NOT NULL DEFAULT 3600,
    threshold JSONB NOT NULL,
    throttle_sec INTEGER NOT NULL DEFAULT 3600,
    approvals INTEGER NOT NULL DEFAULT 0,
    action_playbook_id UUID REFERENCES ops_playbook(id),
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT false,
    change_summary TEXT,
    UNIQUE(company_id, rule_id, version_no)
);

-- Dry-run sandbox executions
CREATE TABLE ops_dry_run_execution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    playbook_id UUID NOT NULL REFERENCES ops_playbook(id),
    version_no INTEGER,
    execution_id UUID NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]',
    total_duration_ms INTEGER,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    result_summary JSONB
);

-- Canary mode executions (scoped subset before global)
CREATE TABLE ops_canary_execution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    fire_id UUID NOT NULL REFERENCES ops_fire(id),
    playbook_id UUID NOT NULL REFERENCES ops_playbook(id),
    canary_scope JSONB NOT NULL, -- e.g., {"customer_segment": "enterprise", "percentage": 5}
    execution_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rollback_at TIMESTAMPTZ,
    success_rate DECIMAL(5,2), -- percentage of successful operations
    impact_summary JSONB,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Human-in-the-loop approvals with premortem diffs
CREATE TABLE ops_approval_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    fire_id UUID NOT NULL REFERENCES ops_fire(id),
    playbook_id UUID NOT NULL REFERENCES ops_playbook(id),
    requested_by TEXT NOT NULL,
    approval_type TEXT NOT NULL CHECK (approval_type IN ('DUAL_CONTROL', 'BLAST_RADIUS', 'CANARY_PROMOTION')),
    impact_estimate JSONB NOT NULL, -- premortem analysis
    diff_summary JSONB NOT NULL, -- what will change
    blast_radius_count INTEGER NOT NULL DEFAULT 0,
    risk_score DECIMAL(3,2) NOT NULL DEFAULT 0.0, -- 0.0 to 1.0
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post-action verification and rollback hooks
CREATE TABLE ops_action_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    fire_id UUID NOT NULL REFERENCES ops_fire(id),
    step_id UUID NOT NULL,
    action_code TEXT NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('OUTCOME_CHECK', 'GUARDRAIL_CHECK', 'ROLLBACK_TRIGGER')),
    expected_outcome JSONB,
    actual_outcome JSONB,
    verification_result TEXT NOT NULL CHECK (verification_result IN ('PASS', 'FAIL', 'WARNING')),
    guardrail_violations JSONB DEFAULT '[]',
    rollback_triggered BOOLEAN NOT NULL DEFAULT false,
    rollback_reason TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by TEXT NOT NULL
);

-- Observability metrics for success/failure rates and performance
CREATE TABLE ops_execution_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    playbook_id UUID NOT NULL REFERENCES ops_playbook(id),
    execution_date DATE NOT NULL,
    total_executions INTEGER NOT NULL DEFAULT 0,
    successful_executions INTEGER NOT NULL DEFAULT 0,
    failed_executions INTEGER NOT NULL DEFAULT 0,
    suppressed_executions INTEGER NOT NULL DEFAULT 0,
    p50_duration_ms INTEGER,
    p95_duration_ms INTEGER,
    p99_duration_ms INTEGER,
    avg_duration_ms INTEGER,
    success_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, playbook_id, execution_date)
);

-- Blast radius tracking for safety caps
CREATE TABLE ops_blast_radius_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    fire_id UUID NOT NULL REFERENCES ops_fire(id),
    playbook_id UUID NOT NULL REFERENCES ops_playbook(id),
    entity_type TEXT NOT NULL, -- e.g., 'customer', 'invoice', 'payment'
    entity_count INTEGER NOT NULL,
    entity_ids JSONB DEFAULT '[]', -- array of affected entity IDs
    blast_radius_percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ops_playbook_version_playbook ON ops_playbook_version(playbook_id, version_no DESC);
CREATE INDEX idx_ops_rule_version_rule ON ops_rule_version(rule_id, version_no DESC);
CREATE INDEX idx_ops_dry_run_execution_playbook ON ops_dry_run_execution(playbook_id, executed_at DESC);
CREATE INDEX idx_ops_canary_execution_fire ON ops_canary_execution(fire_id);
CREATE INDEX idx_ops_approval_request_fire ON ops_approval_request(fire_id, status);
CREATE INDEX idx_ops_action_verification_fire ON ops_action_verification(fire_id, step_id);
CREATE INDEX idx_ops_execution_metrics_playbook ON ops_execution_metrics(playbook_id, execution_date DESC);
CREATE INDEX idx_ops_blast_radius_log_fire ON ops_blast_radius_log(fire_id);

-- Comments for documentation
COMMENT ON TABLE ops_playbook_version IS 'Git-like versioning for playbooks with change tracking';
COMMENT ON TABLE ops_rule_version IS 'Git-like versioning for rules with change tracking';
COMMENT ON TABLE ops_dry_run_execution IS 'Sandbox executions for testing playbooks safely';
COMMENT ON TABLE ops_canary_execution IS 'Canary mode executions on scoped subsets before global rollout';
COMMENT ON TABLE ops_approval_request IS 'Human-in-the-loop approval workflow with impact analysis';
COMMENT ON TABLE ops_action_verification IS 'Post-action verification and automatic rollback triggers';
COMMENT ON TABLE ops_execution_metrics IS 'Observability metrics for success rates and performance';
COMMENT ON TABLE ops_blast_radius_log IS 'Blast radius tracking for safety and compliance';
