-- M26.8: Auditor Workspace - RBAC Capabilities
-- Migration: 0264_auditor_rbac_caps.sql

-- Insert RBAC capabilities for auditor workspace management
INSERT INTO rbac_capability (id, company_id, code, name, description, category, created_by, created_at, updated_by, updated_at)
VALUES 
  ('audit_admin', 'SYSTEM', 'audit:admin', 'Audit Admin', 'Create auditors, grants, revoke access', 'AUDIT', 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_respond', 'SYSTEM', 'audit:respond', 'Audit Respond', 'Reply to auditor requests, attach evidence', 'AUDIT', 'SYSTEM', now(), 'SYSTEM', now()),
  ('audit_view', 'SYSTEM', 'audit:view', 'Audit View', 'Internal read access to auditor workspace dashboards', 'AUDIT', 'SYSTEM', now(), 'SYSTEM', now())
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE rbac_capability IS 'RBAC capabilities for auditor workspace management';
