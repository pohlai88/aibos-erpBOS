-- M26.1: Auto-Controls & Certifications - Control Evidence
-- Migration: 0202_controls_evidence.sql

-- Control Evidence Table
CREATE TABLE ctrl_evidence (
    id TEXT PRIMARY KEY,
    ctrl_run_id TEXT NOT NULL REFERENCES ctrl_run(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('LINK', 'FILE', 'NOTE', 'SNAPSHOT')),
    uri_or_note TEXT NOT NULL,
    checksum TEXT, -- SHA256 hash for immutability verification
    added_by TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure checksum is provided for FILE and SNAPSHOT types
    CHECK (
        (kind IN ('LINK', 'NOTE')) OR 
        (kind IN ('FILE', 'SNAPSHOT') AND checksum IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_ctrl_evidence_run_kind ON ctrl_evidence(ctrl_run_id, kind);
CREATE INDEX idx_ctrl_evidence_checksum ON ctrl_evidence(checksum) WHERE checksum IS NOT NULL;
CREATE INDEX idx_ctrl_evidence_added_at ON ctrl_evidence(added_at);

-- Comments for documentation
COMMENT ON TABLE ctrl_evidence IS 'Evidence attached to control runs for audit purposes';
COMMENT ON COLUMN ctrl_evidence.kind IS 'Evidence type: LINK, FILE, NOTE, SNAPSHOT';
COMMENT ON COLUMN ctrl_evidence.uri_or_note IS 'URI for files/links, or note content for NOTE type';
COMMENT ON COLUMN ctrl_evidence.checksum IS 'SHA256 hash for FILE and SNAPSHOT types to ensure immutability';
