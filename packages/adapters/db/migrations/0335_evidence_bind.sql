-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - Evidence Binding
-- Migration: 0335_evidence_bind.sql

-- Link impairment tests to M26.4 evidence packs
ALTER TABLE lease_imp_test ADD COLUMN evidence_pack_id TEXT REFERENCES evidence_pack(id) ON DELETE SET NULL;

-- Link onerous assessments to M26.4 evidence packs
ALTER TABLE onerous_assessment ADD COLUMN evidence_pack_id TEXT REFERENCES evidence_pack(id) ON DELETE SET NULL;

-- Add indexes for evidence pack queries
CREATE INDEX idx_lease_imp_test_evidence_pack ON lease_imp_test(evidence_pack_id);
CREATE INDEX idx_onerous_assessment_evidence_pack ON onerous_assessment(evidence_pack_id);

-- Add comments for clarity
COMMENT ON COLUMN lease_imp_test.evidence_pack_id IS 'Reference to M26.4 evidence pack for impairment test documentation';
COMMENT ON COLUMN onerous_assessment.evidence_pack_id IS 'Reference to M26.4 evidence pack for onerous contract documentation';
