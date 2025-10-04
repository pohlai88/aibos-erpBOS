-- M26.8: Auditor Workspace - Foreign Key Hardening
-- Migration: 0265_auditor_fk_hardening.sql

-- Add foreign key constraints for created_by fields where applicable
-- Note: These reference user accounts, but we'll use TEXT for flexibility

-- Add constraints to ensure data integrity
ALTER TABLE audit_grant ADD CONSTRAINT fk_audit_grant_created_by 
  FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE RESTRICT;

-- Add check constraints for data validation
ALTER TABLE audit_auditor ADD CONSTRAINT chk_audit_auditor_status 
  CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED'));

ALTER TABLE audit_request ADD CONSTRAINT chk_audit_request_state 
  CHECK (state IN ('OPEN', 'RESPONDED', 'CLOSED'));

ALTER TABLE audit_request_msg ADD CONSTRAINT chk_audit_request_msg_author_kind 
  CHECK (author_kind IN ('AUDITOR', 'OWNER', 'SYSTEM'));

ALTER TABLE audit_access_log ADD CONSTRAINT chk_audit_access_log_action 
  CHECK (action IN ('VIEW', 'DOWNLOAD', 'DENY', 'EXPIRED'));

-- Comments for documentation
COMMENT ON CONSTRAINT fk_audit_grant_created_by ON audit_grant IS 'Ensures grant creator exists';
COMMENT ON CONSTRAINT chk_audit_auditor_status ON audit_auditor IS 'Validates auditor status values';
COMMENT ON CONSTRAINT chk_audit_request_state ON audit_request IS 'Validates request state values';
COMMENT ON CONSTRAINT chk_audit_request_msg_author_kind ON audit_request_msg IS 'Validates message author types';
COMMENT ON CONSTRAINT chk_audit_access_log_action ON audit_access_log IS 'Validates access log action types';
