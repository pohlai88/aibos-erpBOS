-- M26.1: Auto-Controls & Certifications - Certification Core
-- Migration: 0203_cert_core.sql

-- Certification Statements Table
CREATE TABLE cert_statement (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    code TEXT NOT NULL,
    text TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('ENTITY', 'CONSOLIDATED')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    
    -- Unique constraint per company
    UNIQUE(company_id, code)
);

-- Certification Sign-offs Table
CREATE TABLE cert_signoff (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT NOT NULL REFERENCES close_run(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('ENTITY', 'CONSOLIDATED')),
    signer_role TEXT NOT NULL CHECK (signer_role IN ('MANAGER', 'CONTROLLER', 'CFO')),
    signer_name TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    statement_id TEXT NOT NULL REFERENCES cert_statement(id),
    statement_text TEXT NOT NULL, -- Snapshot of statement text at time of signing
    snapshot_uri TEXT, -- URI to immutable snapshot of financial statements
    checksum TEXT NOT NULL, -- SHA256 hash of snapshot for integrity verification
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    
    -- Ensure unique sign-off per run/level/role combination
    UNIQUE(run_id, level, signer_role)
);

-- Indexes for performance
CREATE INDEX idx_cert_statement_company_active ON cert_statement(company_id, active);
CREATE INDEX idx_cert_statement_level ON cert_statement(level);
CREATE INDEX idx_cert_signoff_run_level ON cert_signoff(run_id, level);
CREATE INDEX idx_cert_signoff_role_signed ON cert_signoff(signer_role, signed_at);
CREATE INDEX idx_cert_signoff_checksum ON cert_signoff(checksum);

-- Comments for documentation
COMMENT ON TABLE cert_statement IS 'Certification statement templates for different levels and roles';
COMMENT ON TABLE cert_signoff IS 'Individual certification sign-offs with immutable snapshots';
COMMENT ON COLUMN cert_statement.level IS 'Certification level: ENTITY, CONSOLIDATED';
COMMENT ON COLUMN cert_signoff.signer_role IS 'Role of signer: MANAGER, CONTROLLER, CFO';
COMMENT ON COLUMN cert_signoff.statement_text IS 'Snapshot of statement text at time of signing';
COMMENT ON COLUMN cert_signoff.snapshot_uri IS 'URI to immutable snapshot of financial statements';
COMMENT ON COLUMN cert_signoff.checksum IS 'SHA256 hash of snapshot for integrity verification';
