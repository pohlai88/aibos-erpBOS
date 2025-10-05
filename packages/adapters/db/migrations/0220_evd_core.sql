-- M26.4 Enhanced Evidence Vault - Content-Addressed Storage
-- Migration: 0220_evd_core.sql

-- Evidence object store (content-addressed)
CREATE TABLE evd_object (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  sha256_hex    TEXT NOT NULL,              -- content hash
  size_bytes    BIGINT NOT NULL,
  mime          TEXT NOT NULL,
  storage_uri   TEXT NOT NULL,              -- e.g. s3://... or file://...
  uploaded_by   TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, sha256_hex)
);

-- Logical evidence records referencing the object
CREATE TABLE evd_record (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  object_id     UUID NOT NULL REFERENCES evd_object(id) ON DELETE RESTRICT,
  source        TEXT NOT NULL,              -- CTRL|CLOSE|FLUX|JOURNAL|BANK|OTHER
  source_id     TEXT NOT NULL,              -- foreign id for cross-linking
  title         TEXT NOT NULL,
  note          TEXT,
  tags          TEXT[] DEFAULT '{}',
  pii_level     TEXT NOT NULL DEFAULT 'NONE', -- NONE|LOW|MEDIUM|HIGH
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Redaction rule catalog
CREATE TABLE evd_redaction_rule (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  code          TEXT NOT NULL,
  description   TEXT,
  -- jsonb of field patterns / regex / mime scopes
  rule          JSONB NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  updated_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Indexes for performance
CREATE INDEX ON evd_object(company_id, sha256_hex);
CREATE INDEX ON evd_object(uploaded_at);
CREATE INDEX ON evd_record(company_id, source, source_id);
CREATE INDEX ON evd_record(company_id, pii_level);
CREATE INDEX ON evd_redaction_rule(company_id, enabled);

-- Comments for documentation
COMMENT ON TABLE evd_object IS 'Content-addressed evidence objects with SHA256 integrity';
COMMENT ON TABLE evd_record IS 'Logical evidence records linking objects to business contexts';
COMMENT ON TABLE evd_redaction_rule IS 'PII/PHI redaction rules for evidence export';
