-- M27.2: Performance indexes for Playbook Studio
-- Optimized indexes for visual editor, versioning, and observability queries

-- Playbook versioning indexes
CREATE INDEX CONCURRENTLY idx_ops_playbook_version_active ON ops_playbook_version(playbook_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_ops_playbook_version_company_active ON ops_playbook_version(company_id, is_active) WHERE is_active = true;

-- Rule versioning indexes  
CREATE INDEX CONCURRENTLY idx_ops_rule_version_active ON ops_rule_version(rule_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_ops_rule_version_company_active ON ops_rule_version(company_id, is_active) WHERE is_active = true;

-- Dry-run execution indexes
CREATE INDEX CONCURRENTLY idx_ops_dry_run_execution_company_date ON ops_dry_run_execution(company_id, executed_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_dry_run_execution_playbook_date ON ops_dry_run_execution(playbook_id, executed_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_dry_run_execution_status ON ops_dry_run_execution(status, executed_at DESC);

-- Canary execution indexes
CREATE INDEX CONCURRENTLY idx_ops_canary_execution_company ON ops_canary_execution(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_canary_execution_status ON ops_canary_execution(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_canary_execution_playbook ON ops_canary_execution(playbook_id, created_at DESC);

-- Approval request indexes
CREATE INDEX CONCURRENTLY idx_ops_approval_request_company_status ON ops_approval_request(company_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_approval_request_requested_by ON ops_approval_request(requested_by, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_approval_request_expires ON ops_approval_request(expires_at) WHERE status = 'PENDING';

-- Action verification indexes
CREATE INDEX CONCURRENTLY idx_ops_action_verification_company ON ops_action_verification(company_id, verified_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_action_verification_result ON ops_action_verification(verification_result, verified_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_action_verification_rollback ON ops_action_verification(rollback_triggered, verified_at DESC);

-- Execution metrics indexes
CREATE INDEX CONCURRENTLY idx_ops_execution_metrics_company_date ON ops_execution_metrics(company_id, execution_date DESC);
CREATE INDEX CONCURRENTLY idx_ops_execution_metrics_playbook_date ON ops_execution_metrics(playbook_id, execution_date DESC);
CREATE INDEX CONCURRENTLY idx_ops_execution_metrics_success_rate ON ops_execution_metrics(success_rate DESC, execution_date DESC);

-- Blast radius log indexes
CREATE INDEX CONCURRENTLY idx_ops_blast_radius_log_company ON ops_blast_radius_log(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_blast_radius_log_playbook ON ops_blast_radius_log(playbook_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ops_blast_radius_log_entity_type ON ops_blast_radius_log(entity_type, created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_ops_playbook_version_latest ON ops_playbook_version(company_id, playbook_id, version_no DESC);
CREATE INDEX CONCURRENTLY idx_ops_rule_version_latest ON ops_rule_version(company_id, rule_id, version_no DESC);
CREATE INDEX CONCURRENTLY idx_ops_dry_run_execution_recent ON ops_dry_run_execution(company_id, playbook_id, executed_at DESC) WHERE executed_at > NOW() - INTERVAL '30 days';
CREATE INDEX CONCURRENTLY idx_ops_canary_execution_recent ON ops_canary_execution(company_id, playbook_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- Comments
COMMENT ON INDEX idx_ops_playbook_version_active IS 'Fast lookup of active playbook versions';
COMMENT ON INDEX idx_ops_rule_version_active IS 'Fast lookup of active rule versions';
COMMENT ON INDEX idx_ops_dry_run_execution_company_date IS 'Recent dry-run executions by company';
COMMENT ON INDEX idx_ops_canary_execution_company IS 'Canary executions by company and date';
COMMENT ON INDEX idx_ops_approval_request_company_status IS 'Pending approvals by company and status';
COMMENT ON INDEX idx_ops_action_verification_company IS 'Action verifications by company and date';
COMMENT ON INDEX idx_ops_execution_metrics_company_date IS 'Execution metrics by company and date';
COMMENT ON INDEX idx_ops_blast_radius_log_company IS 'Blast radius logs by company and date';
