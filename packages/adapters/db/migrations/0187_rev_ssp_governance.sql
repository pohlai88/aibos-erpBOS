-- M25.3: SSP Governance and Change Management
-- Change request workflow for SSP catalog modifications

CREATE TABLE rev_ssp_change (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    requestor TEXT NOT NULL,
    reason TEXT NOT NULL,
    diff JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEWED', 'APPROVED', 'REJECTED')),
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    decision_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX rev_ssp_change_company_status_idx ON rev_ssp_change(company_id, status, created_at DESC);
CREATE INDEX rev_ssp_change_requestor_idx ON rev_ssp_change(company_id, requestor, created_at DESC);
CREATE INDEX rev_ssp_change_decided_idx ON rev_ssp_change(company_id, decided_by, decided_at DESC);

-- Comments for documentation
COMMENT ON TABLE rev_ssp_change IS 'SSP catalog change request workflow with approval process';
COMMENT ON COLUMN rev_ssp_change.requestor IS 'User ID who requested the change';
COMMENT ON COLUMN rev_ssp_change.reason IS 'Business reason for the SSP change';
COMMENT ON COLUMN rev_ssp_change.diff IS 'JSON diff showing what changed (old vs new values)';
COMMENT ON COLUMN rev_ssp_change.status IS 'Workflow status: DRAFT -> REVIEWED -> APPROVED/REJECTED';
COMMENT ON COLUMN rev_ssp_change.decided_by IS 'User ID who made the approval/rejection decision';
COMMENT ON COLUMN rev_ssp_change.decided_at IS 'Timestamp when decision was made';
COMMENT ON COLUMN rev_ssp_change.decision_notes IS 'Notes from the approver/rejector';
