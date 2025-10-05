-- M26.4 Enhanced Evidence Vault - RBAC Integration
-- Migration: 0226_evd_rbac.sql

-- Add evidence-specific capabilities to existing RBAC system
-- These capabilities will be integrated into the existing rbac.ts file

-- Capabilities added:
-- evidence:write  (upload/link)
-- evidence:read   (download/view if permitted)
-- evidence:admin  (redaction rules, binder policy)
-- binder:build    (create eBinder)
-- binder:sign     (attest binder)

-- Note: The actual capability definitions are managed in the application code
-- This migration documents the new capabilities for audit purposes

-- Create a reference table for capability documentation
CREATE TABLE IF NOT EXISTS evd_capability_ref (
  capability    TEXT PRIMARY KEY,
  description   TEXT NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the new evidence capabilities
INSERT INTO evd_capability_ref (capability, description) VALUES
  ('evidence:write', 'Upload evidence objects and create evidence records'),
  ('evidence:read', 'View and download evidence if permitted by PII level'),
  ('evidence:admin', 'Manage redaction rules and binder policies'),
  ('binder:build', 'Create eBinder artifacts from manifests'),
  ('binder:sign', 'Attest and sign eBinder artifacts')
ON CONFLICT (capability) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE evd_capability_ref IS 'Reference table documenting evidence-specific RBAC capabilities';
