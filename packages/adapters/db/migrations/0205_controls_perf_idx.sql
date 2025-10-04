-- M26.1: Auto-Controls & Certifications - Performance Indexes
-- Migration: 0205_controls_perf_idx.sql

-- Additional performance indexes for controls tables

-- Control runs performance indexes
CREATE INDEX idx_ctrl_run_status_scheduled_at ON ctrl_run(status, scheduled_at);
CREATE INDEX idx_ctrl_run_company_control_finished ON ctrl_run(company_id, control_id, finished_at) WHERE finished_at IS NOT NULL;

-- Control exceptions performance indexes
CREATE INDEX idx_ctrl_exception_remediation_state_material ON ctrl_exception(remediation_state, material);
CREATE INDEX idx_ctrl_exception_assignee_due_at ON ctrl_exception(assignee, due_at) WHERE assignee IS NOT NULL AND due_at IS NOT NULL;
CREATE INDEX idx_ctrl_exception_created_at ON ctrl_exception(created_at);

-- Control assignments performance indexes
CREATE INDEX idx_ctrl_assignment_active_sla_due_at ON ctrl_assignment(active, sla_due_at) WHERE active = true AND sla_due_at IS NOT NULL;
CREATE INDEX idx_ctrl_assignment_owner_active ON ctrl_assignment(owner, active) WHERE active = true;
CREATE INDEX idx_ctrl_assignment_approver_active ON ctrl_assignment(approver, active) WHERE active = true;

-- Control evidence performance indexes
CREATE INDEX idx_ctrl_evidence_kind_added_at ON ctrl_evidence(kind, added_at);
CREATE INDEX idx_ctrl_evidence_added_by_added_at ON ctrl_evidence(added_by, added_at);

-- Certification performance indexes
CREATE INDEX idx_cert_signoff_run_level_role ON cert_signoff(run_id, level, signer_role);
CREATE INDEX idx_cert_signoff_signed_at ON cert_signoff(signed_at);
CREATE INDEX idx_cert_signoff_company_level ON cert_signoff(company_id, level);

-- Composite indexes for common query patterns
CREATE INDEX idx_ctrl_run_company_status_scheduled ON ctrl_run(company_id, status, scheduled_at);
CREATE INDEX idx_ctrl_exception_run_material_state ON ctrl_exception(ctrl_run_id, material, remediation_state);
CREATE INDEX idx_ctrl_assignment_control_run_active ON ctrl_assignment(control_id, run_id, active) WHERE run_id IS NOT NULL AND active = true;
