-- M26.4: Evidence Vault & eBinder - Core Evidence Tables
-- Migration: 0215_evidence_vault.sql

-- Evidence Manifest Table (immutable evidence bundles)
CREATE TABLE ctrl_evidence_manifest (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    control_id TEXT NOT NULL REFERENCES ctrl_control(id) ON DELETE CASCADE,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES close_task(id) ON DELETE CASCADE,
    bundle_name TEXT NOT NULL,
    bundle_type TEXT NOT NULL CHECK (bundle_type IN ('CONTROL', 'CLOSE_RUN', 'TASK', 'CUSTOM')),
    manifest_hash TEXT NOT NULL, -- SHA256 of manifest content
    content_hash TEXT NOT NULL, -- SHA256 of all evidence content
    size_bytes BIGINT NOT NULL DEFAULT 0,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    sealed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- Immutable timestamp
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'REDACTED')),
    
    -- Unique constraint per company/bundle
    UNIQUE(company_id, bundle_name)
);

-- Evidence Items Table (individual evidence pieces)
CREATE TABLE ctrl_evidence_item (
    id TEXT PRIMARY KEY,
    manifest_id TEXT NOT NULL REFERENCES ctrl_evidence_manifest(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('DOCUMENT', 'SCREENSHOT', 'EXPORT', 'CALCULATION', 'ATTESTATION', 'EMAIL', 'SYSTEM_LOG')),
    file_path TEXT, -- Path to stored file (if applicable)
    content_hash TEXT NOT NULL, -- SHA256 of item content
    size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    redacted BOOLEAN NOT NULL DEFAULT false,
    redaction_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    
    -- Unique constraint per manifest/item
    UNIQUE(manifest_id, item_name)
);

-- eBinder Collections Table (monthly/quarterly binders)
CREATE TABLE close_ebinder (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    binder_name TEXT NOT NULL,
    binder_type TEXT NOT NULL CHECK (binder_type IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    manifest_ids TEXT[] NOT NULL DEFAULT '{}', -- Array of evidence manifest IDs
    total_manifests INTEGER NOT NULL DEFAULT 0,
    total_evidence_items INTEGER NOT NULL DEFAULT 0,
    total_size_bytes BIGINT NOT NULL DEFAULT 0,
    binder_hash TEXT NOT NULL, -- SHA256 of complete binder
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    generated_by TEXT NOT NULL,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATING', 'GENERATED', 'ARCHIVED')),
    
    -- Unique constraint per company/period
    UNIQUE(company_id, binder_type, period_start, period_end)
);

-- Evidence Attestation Table (digital signatures)
CREATE TABLE ctrl_evidence_attestation (
    id TEXT PRIMARY KEY,
    manifest_id TEXT NOT NULL REFERENCES ctrl_evidence_manifest(id) ON DELETE CASCADE,
    attestor_name TEXT NOT NULL,
    attestor_role TEXT NOT NULL CHECK (attestor_role IN ('CONTROLLER', 'MANAGER', 'AUDITOR', 'CFO')),
    attestation_type TEXT NOT NULL CHECK (attestation_type IN ('REVIEW', 'APPROVAL', 'VERIFICATION', 'CERTIFICATION')),
    digital_signature TEXT NOT NULL, -- Digital signature hash
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    
    -- Unique constraint per manifest/attestor/type
    UNIQUE(manifest_id, attestor_name, attestation_type)
);

-- Indexes for performance
CREATE INDEX idx_ctrl_evidence_manifest_company ON ctrl_evidence_manifest(company_id);
CREATE INDEX idx_ctrl_evidence_manifest_control ON ctrl_evidence_manifest(control_id);
CREATE INDEX idx_ctrl_evidence_manifest_run ON ctrl_evidence_manifest(run_id);
CREATE INDEX idx_ctrl_evidence_manifest_bundle ON ctrl_evidence_manifest(bundle_name);
CREATE INDEX idx_ctrl_evidence_manifest_hash ON ctrl_evidence_manifest(manifest_hash);
CREATE INDEX idx_ctrl_evidence_manifest_sealed ON ctrl_evidence_manifest(sealed_at);

CREATE INDEX idx_ctrl_evidence_item_manifest ON ctrl_evidence_item(manifest_id);
CREATE INDEX idx_ctrl_evidence_item_type ON ctrl_evidence_item(item_type);
CREATE INDEX idx_ctrl_evidence_item_hash ON ctrl_evidence_item(content_hash);
CREATE INDEX idx_ctrl_evidence_item_redacted ON ctrl_evidence_item(redacted);

CREATE INDEX idx_close_ebinder_company ON close_ebinder(company_id);
CREATE INDEX idx_close_ebinder_run ON close_ebinder(run_id);
CREATE INDEX idx_close_ebinder_period ON close_ebinder(period_start, period_end);
CREATE INDEX idx_close_ebinder_type ON close_ebinder(binder_type);
CREATE INDEX idx_close_ebinder_generated ON close_ebinder(generated_at);

CREATE INDEX idx_ctrl_evidence_attestation_manifest ON ctrl_evidence_attestation(manifest_id);
CREATE INDEX idx_ctrl_evidence_attestation_role ON ctrl_evidence_attestation(attestor_role);
CREATE INDEX idx_ctrl_evidence_attestation_signed ON ctrl_evidence_attestation(signed_at);

-- Comments for documentation
COMMENT ON TABLE ctrl_evidence_manifest IS 'Immutable evidence bundles with SHA256 manifests for audit integrity';
COMMENT ON TABLE ctrl_evidence_item IS 'Individual evidence pieces within manifests with complete audit packages';
COMMENT ON TABLE close_ebinder IS 'Monthly/quarterly eBinder collections with complete audit packages';
COMMENT ON TABLE ctrl_evidence_attestation IS 'Digital attestations and signatures for evidence validation';
