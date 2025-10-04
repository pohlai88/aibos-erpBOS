-- M26.8: Auditor Workspace - Outbox Events
-- Migration: 0266_auditor_outbox.sql

-- Insert outbox event types for auditor workspace
INSERT INTO outbox_event_type (id, company_id, code, name, description, schema_version, created_by, created_at, updated_by, updated_at)
VALUES 
  ('audit_grant_issued', 'SYSTEM', 'AUDIT_GRANT_ISSUED', 'Audit Grant Issued', 'Grant issued to external auditor', 1, 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_grant_expired', 'SYSTEM', 'AUDIT_GRANT_EXPIRED', 'Audit Grant Expired', 'Grant expired for external auditor', 1, 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_pbc_opened', 'SYSTEM', 'AUDIT_PBC_OPENED', 'Audit PBC Opened', 'PBC request opened by external auditor', 1, 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_pbc_responded', 'SYSTEM', 'AUDIT_PBC_RESPONDED', 'Audit PBC Responded', 'PBC request responded by internal owner', 1, 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_session_created', 'SYSTEM', 'AUDIT_SESSION_CREATED', 'Audit Session Created', 'New auditor session created', 1, 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_session_expired', 'SYSTEM', 'AUDIT_SESSION_EXPIRED', 'Audit Session Expired', 'Auditor session expired', 1, 'SYSTEM', now(), 'SYSTEM', now())
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE outbox_event_type IS 'Event types for auditor workspace outbox events';
