-- M26.8: Auditor Workspace - Download Keys
-- Migration: 0268_auditor_download_keys.sql

-- Short-lived signed URL keys for downloads (defense in depth)
CREATE TABLE audit_dl_key (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES audit_grant(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,                 -- hash of the download key
  expires_at TIMESTAMPTZ NOT NULL,        -- short-lived (e.g., 5 minutes)
  used_at TIMESTAMPTZ,                    -- track one-time use
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(grant_id, key_hash)
);

-- Indexes for performance
CREATE INDEX ON audit_dl_key(grant_id, expires_at);
CREATE INDEX ON audit_dl_key(key_hash, expires_at);
CREATE INDEX ON audit_dl_key(expires_at) WHERE used_at IS NULL;

-- Comments for documentation
COMMENT ON TABLE audit_dl_key IS 'Short-lived download keys for auditor file access';
COMMENT ON COLUMN audit_dl_key.key_hash IS 'Hash of the download key for security';
COMMENT ON COLUMN audit_dl_key.expires_at IS 'Expiration time for the download key';
COMMENT ON COLUMN audit_dl_key.used_at IS 'Timestamp when key was used (one-time use)';
