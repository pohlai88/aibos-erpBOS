-- M26.8: Auditor Workspace - Performance Indexes
-- Migration: 0263_auditor_perf_idx.sql

-- Additional performance indexes for auditor workspace queries
CREATE INDEX idx_audit_grant_auditor_expires ON audit_grant(auditor_id, expires_at);
CREATE INDEX idx_audit_grant_scope_object ON audit_grant(scope, object_id);
CREATE INDEX idx_audit_access_log_company_auditor_ts ON audit_access_log(company_id, auditor_id, ts DESC);
CREATE INDEX idx_audit_access_log_session_action ON audit_access_log(session_id, action, ts DESC);
CREATE INDEX idx_audit_request_company_state_due ON audit_request(company_id, state, due_at);
CREATE INDEX idx_audit_request_auditor_state ON audit_request(auditor_id, state, created_at DESC);
CREATE INDEX idx_audit_request_msg_request_created ON audit_request_msg(request_id, created_at ASC);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_grant_active ON audit_grant(auditor_id, expires_at) WHERE expires_at > now();
CREATE INDEX idx_audit_session_active ON audit_session(auditor_id, expires_at) WHERE expires_at > now();
CREATE INDEX idx_audit_request_open ON audit_request(company_id, state) WHERE state = 'OPEN';
