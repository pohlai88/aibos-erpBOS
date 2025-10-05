-- M26.4 Enhanced Evidence Vault - Linking System
-- Migration: 0221_evd_linking.sql

-- Link evidence to control runs / close runs (many-to-many)
CREATE TABLE evd_link (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  record_id     UUID NOT NULL REFERENCES evd_record(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,              -- CTRL_RUN|CLOSE_RUN|EXCEPTION|TASK
  ref_id        TEXT NOT NULL,
  added_by      TEXT NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, record_id, kind, ref_id)
);

-- Indexes for performance
CREATE INDEX ON evd_link(company_id, kind, ref_id);
CREATE INDEX ON evd_link(record_id);
CREATE INDEX ON evd_link(added_at);

-- Comments for documentation
COMMENT ON TABLE evd_link IS 'Many-to-many linking between evidence records and business objects';
