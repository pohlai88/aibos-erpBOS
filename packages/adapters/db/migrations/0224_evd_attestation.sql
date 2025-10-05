-- M26.4 Enhanced Evidence Vault - Attestation System
-- Migration: 0224_evd_attestation.sql

CREATE TABLE evd_attestation (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL,
  binder_id     UUID NOT NULL REFERENCES evd_binder(id) ON DELETE CASCADE,
  signer_id     TEXT NOT NULL,
  signer_role   TEXT NOT NULL,              -- MANAGER|CONTROLLER|CFO|AUDITOR
  payload       JSONB NOT NULL,             -- statement + meta
  sha256_hex    TEXT NOT NULL,              -- checksum of payload
  signed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(binder_id, signer_role, signer_id)
);

-- Indexes for performance
CREATE INDEX ON evd_attestation(company_id, binder_id);
CREATE INDEX ON evd_attestation(signer_role);
CREATE INDEX ON evd_attestation(signed_at);

-- Comments for documentation
COMMENT ON TABLE evd_attestation IS 'Time-sealed attestations with signature payloads';
