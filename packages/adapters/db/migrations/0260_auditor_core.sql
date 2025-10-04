-- M26.8: Auditor Workspace - Core Tables
-- Migration: 0260_auditor_core.sql

-- Auditor accounts (external) with company-scoped, time-boxed access
CREATE TABLE audit_auditor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  email CITEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE|SUSPENDED|REVOKED
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Grant scope enum
CREATE TYPE audit_grant_scope AS ENUM ('ATTEST_PACK','CTRL_RUN','EVIDENCE','REPORT','EXTRACT');

-- Least-privilege grants for specific objects
CREATE TABLE audit_grant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  auditor_id UUID NOT NULL REFERENCES audit_auditor(id) ON DELETE CASCADE,
  scope audit_grant_scope NOT NULL,
  object_id TEXT NOT NULL,                 -- e.g., attest_pack.id / control_run.id / evd_record.id
  can_download BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,         -- hard stop
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auditor_id, scope, object_id)
);

-- Auditor session management
CREATE TABLE audit_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  auditor_id UUID NOT NULL REFERENCES audit_auditor(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,                -- store hash only
  ip INET, 
  ua TEXT, 
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- End-to-end audit trail
CREATE TABLE audit_access_log (
  id BIGSERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  auditor_id UUID NOT NULL,
  session_id UUID,
  scope audit_grant_scope NOT NULL,
  object_id TEXT NOT NULL,
  action TEXT NOT NULL,                    -- VIEW|DOWNLOAD|DENY|EXPIRED
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX ON audit_auditor(company_id, email);
CREATE INDEX ON audit_auditor(company_id, status);
CREATE INDEX ON audit_grant(auditor_id, expires_at);
CREATE INDEX ON audit_grant(company_id, scope, object_id);
CREATE INDEX ON audit_session(auditor_id, expires_at);
CREATE INDEX ON audit_access_log(company_id, auditor_id, ts DESC);
CREATE INDEX ON audit_access_log(session_id, ts DESC);

-- Comments for documentation
COMMENT ON TABLE audit_auditor IS 'External auditor accounts with company-scoped access';
COMMENT ON TABLE audit_grant IS 'Least-privilege grants for specific audit objects';
COMMENT ON TABLE audit_session IS 'Auditor session tokens with device binding';
COMMENT ON TABLE audit_access_log IS 'Complete audit trail of all auditor actions';
