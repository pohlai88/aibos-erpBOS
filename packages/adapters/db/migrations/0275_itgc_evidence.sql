-- M26.9: ITGC & UAR Bridge - Evidence & Snapshots
-- Migration: 0275_itgc_evidence.sql

-- Immutable snapshots for audit evidence
CREATE TABLE it_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scope TEXT NOT NULL,          -- USERS|ROLES|GRANTS|SOD|BREAKGLASS
  sha256 TEXT NOT NULL,         -- of normalized snapshot
  evd_record_id UUID,           -- link to content-addressed blob in Evidence Vault
  UNIQUE(company_id, scope, taken_at)
);

-- UAR evidence packs (eBinders)
CREATE TABLE uar_pack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES uar_campaign(id) ON DELETE CASCADE,
  sha256 TEXT NOT NULL,
  evd_record_id UUID NOT NULL,  -- eBinder in Evidence Vault
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id)
);

-- Performance indexes
CREATE INDEX idx_it_snapshot_company_scope ON it_snapshot(company_id, scope);
CREATE INDEX idx_it_snapshot_taken_at ON it_snapshot(taken_at);
CREATE INDEX idx_it_snapshot_sha256 ON it_snapshot(sha256);

CREATE INDEX idx_uar_pack_campaign ON uar_pack(campaign_id);
CREATE INDEX idx_uar_pack_sha256 ON uar_pack(sha256);

-- Comments for documentation
COMMENT ON TABLE it_snapshot IS 'Immutable snapshots of ITGC data for audit evidence';
COMMENT ON TABLE uar_pack IS 'UAR evidence packs (eBinders) stored in Evidence Vault';
COMMENT ON COLUMN it_snapshot.scope IS 'Snapshot scope: USERS, ROLES, GRANTS, SOD, BREAKGLASS';
COMMENT ON COLUMN it_snapshot.sha256 IS 'SHA256 hash of normalized snapshot data';
COMMENT ON COLUMN it_snapshot.evd_record_id IS 'Link to Evidence Vault record (M26.4)';
COMMENT ON COLUMN uar_pack.evd_record_id IS 'eBinder stored in Evidence Vault (M26.4)';
