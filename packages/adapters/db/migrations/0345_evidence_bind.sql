-- M28.7: Lease Derecognition - Evidence Bindings
-- Migration: 0345_evidence_bind.sql

-- lease_exit_evidence — evidence attachments for exit events
CREATE TABLE lease_exit_evidence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exit_id TEXT NOT NULL REFERENCES lease_exit(id) ON DELETE CASCADE,
    evidence_id TEXT NOT NULL, -- reference to M26.4 evidence vault
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('TERMINATION_LETTER', 'SETTLEMENT_INVOICE', 'MAKE_GOOD_REPORT', 'BUYOUT_AGREEMENT', 'RESTORATION_QUOTE', 'OTHER')),
    description TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(exit_id, evidence_id)
);

-- Indexes for performance
CREATE INDEX idx_lease_exit_evidence_exit ON lease_exit_evidence(exit_id);
CREATE INDEX idx_lease_exit_evidence_type ON lease_exit_evidence(evidence_type);
CREATE INDEX idx_lease_exit_evidence_uploaded ON lease_exit_evidence(uploaded_at);

-- Comments for documentation
COMMENT ON TABLE lease_exit_evidence IS 'Evidence attachments for lease exit events (M26.4 integration)';
COMMENT ON COLUMN lease_exit_evidence.evidence_id IS 'Reference to evidence ID in M26.4 evidence vault';
COMMENT ON COLUMN lease_exit_evidence.evidence_type IS 'Type of evidence: TERMINATION_LETTER, SETTLEMENT_INVOICE, MAKE_GOOD_REPORT, BUYOUT_AGREEMENT, RESTORATION_QUOTE, OTHER';
COMMENT ON COLUMN lease_exit_evidence.description IS 'Description of the evidence document';
