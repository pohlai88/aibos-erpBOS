-- M26.4 Enhanced Evidence Vault - Manifest System
-- Migration: 0222_evd_manifest.sql

-- Frozen manifest for a control or close run
CREATE TABLE evd_manifest (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  scope_kind    TEXT NOT NULL,              -- CTRL_RUN|CLOSE_RUN
  scope_id      TEXT NOT NULL,
  filters       JSONB NOT NULL,             -- selection + redaction rules resolved
  object_count  INT NOT NULL,
  total_bytes   BIGINT NOT NULL,
  sha256_hex    TEXT NOT NULL,              -- checksum of manifest JSON payload
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, scope_kind, scope_id, sha256_hex)
);

CREATE TABLE evd_manifest_line (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id   UUID NOT NULL REFERENCES evd_manifest(id) ON DELETE CASCADE,
  record_id     UUID NOT NULL REFERENCES evd_record(id) ON DELETE RESTRICT,
  object_sha256 TEXT NOT NULL,
  object_bytes  BIGINT NOT NULL,
  title         TEXT NOT NULL,
  tags          TEXT[] NOT NULL DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX ON evd_manifest(company_id, scope_kind, scope_id, created_at DESC);
CREATE INDEX ON evd_manifest(sha256_hex);
CREATE INDEX ON evd_manifest_line(manifest_id);
CREATE INDEX ON evd_manifest_line(record_id);

-- Comments for documentation
COMMENT ON TABLE evd_manifest IS 'Frozen manifests with deterministic content and checksums';
COMMENT ON TABLE evd_manifest_line IS 'Individual evidence items within manifests';
