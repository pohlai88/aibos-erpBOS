-- M26.4 Enhanced Evidence Vault - eBinder System
-- Migration: 0223_evd_binder.sql

-- Built binder artifact (ZIP or PDF + ZIP)
CREATE TABLE evd_binder (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  scope_kind    TEXT NOT NULL,              -- CTRL_RUN|CLOSE_RUN
  scope_id      TEXT NOT NULL,
  manifest_id   UUID NOT NULL REFERENCES evd_manifest(id) ON DELETE RESTRICT,
  format        TEXT NOT NULL,              -- ZIP
  storage_uri   TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL,
  sha256_hex    TEXT NOT NULL,
  built_by      TEXT NOT NULL,
  built_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, scope_kind, scope_id, manifest_id)
);

-- Indexes for performance
CREATE INDEX ON evd_binder(company_id, scope_kind, scope_id, built_at DESC);
CREATE INDEX ON evd_binder(manifest_id);
CREATE INDEX ON evd_binder(sha256_hex);

-- Comments for documentation
COMMENT ON TABLE evd_binder IS 'Built eBinder artifacts with deterministic ZIP generation';
