-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Evidence Binding
-- Migration: 0326_evidence_bind.sql

-- Link sublease to M26.4 evidence packs
ALTER TABLE sublease ADD COLUMN evidence_pack_id TEXT REFERENCES evidence_pack(id) ON DELETE SET NULL;

-- Link SLB transaction to M26.4 evidence packs
ALTER TABLE slb_txn ADD COLUMN evidence_pack_id TEXT REFERENCES evidence_pack(id) ON DELETE SET NULL;

-- Add indexes for evidence pack queries
CREATE INDEX idx_sublease_evidence_pack ON sublease(evidence_pack_id);
CREATE INDEX idx_slb_txn_evidence_pack ON slb_txn(evidence_pack_id);

-- Add comments for clarity
COMMENT ON COLUMN sublease.evidence_pack_id IS 'Reference to M26.4 evidence pack for sublease documentation';
COMMENT ON COLUMN slb_txn.evidence_pack_id IS 'Reference to M26.4 evidence pack for SLB documentation';
