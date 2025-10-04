-- M25.3: Allocation Audit Table
-- Comprehensive audit trail for allocation runs and decisions

CREATE TABLE rev_alloc_audit (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('RELATIVE_SSP', 'RESIDUAL', 'ADJ_COST', 'AUTO')),
    strategy TEXT NOT NULL CHECK (strategy IN ('RELATIVE_SSP', 'RESIDUAL', 'AUTO')),
    inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    corridor_flag BOOLEAN NOT NULL DEFAULT false,
    total_invoice_amount NUMERIC(15,2) NOT NULL,
    total_allocated_amount NUMERIC(15,2) NOT NULL,
    rounding_adjustment NUMERIC(15,2) DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_alloc_audit_invoice_idx ON rev_alloc_audit(company_id, invoice_id);
CREATE INDEX rev_alloc_audit_run_idx ON rev_alloc_audit(company_id, run_id);
CREATE INDEX rev_alloc_audit_method_idx ON rev_alloc_audit(company_id, method, created_at);
CREATE INDEX rev_alloc_audit_corridor_idx ON rev_alloc_audit(company_id, corridor_flag, created_at);
CREATE INDEX rev_alloc_audit_created_idx ON rev_alloc_audit(company_id, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE rev_alloc_audit IS 'Comprehensive audit trail for allocation runs and methodology decisions';
COMMENT ON COLUMN rev_alloc_audit.method IS 'Actual allocation method used';
COMMENT ON COLUMN rev_alloc_audit.strategy IS 'Requested allocation strategy';
COMMENT ON COLUMN rev_alloc_audit.inputs IS 'JSON of input data (invoice lines, SSPs, discounts, etc.)';
COMMENT ON COLUMN rev_alloc_audit.results IS 'JSON of allocation results (POBs created, amounts allocated, etc.)';
COMMENT ON COLUMN rev_alloc_audit.corridor_flag IS 'Whether any SSP values fell outside corridor thresholds';
COMMENT ON COLUMN rev_alloc_audit.total_invoice_amount IS 'Total invoice amount before allocation';
COMMENT ON COLUMN rev_alloc_audit.total_allocated_amount IS 'Total amount allocated to POBs';
COMMENT ON COLUMN rev_alloc_audit.rounding_adjustment IS 'Rounding adjustment applied to reconcile totals';
COMMENT ON COLUMN rev_alloc_audit.processing_time_ms IS 'Allocation processing time in milliseconds';
