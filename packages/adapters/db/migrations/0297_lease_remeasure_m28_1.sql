-- M28.1: Lease Remeasurements, Indexation & Month-End Posting
-- Migration: 0297_lease_remeasure_m28_1.sql

-- lease_cpi_index — CPI table with lag policy support
CREATE TABLE lease_cpi_index (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    index_code TEXT NOT NULL,
    index_date DATE NOT NULL,
    index_value NUMERIC(10,6) NOT NULL,
    lag_months INTEGER NOT NULL DEFAULT 0, -- T-N months lag policy
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, index_code, index_date)
);

-- lease_remeasure_artifact — proof artifact for remeasurements (inputs → math → outputs)
CREATE TABLE lease_remeasure_artifact (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES lease_event(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL CHECK (artifact_type IN ('INDEX', 'RATE', 'TERM', 'SCOPE', 'TERMINATION')),
    inputs_jsonb JSONB NOT NULL, -- input parameters for calculation
    calculations_jsonb JSONB NOT NULL, -- step-by-step calculations
    outputs_jsonb JSONB NOT NULL, -- final results
    checksum TEXT NOT NULL, -- SHA-256 hash for integrity
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    computed_by TEXT NOT NULL
);

-- Additional indexes for M28.1 functionality
CREATE INDEX idx_lease_cpi_index_company_code_date ON lease_cpi_index(company_id, index_code, index_date);
CREATE INDEX idx_lease_cpi_index_code_date ON lease_cpi_index(index_code, index_date);
CREATE INDEX idx_lease_event_effective_on ON lease_event(effective_on);
CREATE INDEX idx_lease_schedule_year_month ON lease_schedule(year, month);
CREATE INDEX idx_lease_remeasure_artifact_event ON lease_remeasure_artifact(event_id);
CREATE INDEX idx_lease_remeasure_artifact_lease ON lease_remeasure_artifact(lease_id);

-- GIN indexes for JSONB columns
CREATE INDEX idx_lease_remeasure_artifact_inputs_jsonb ON lease_remeasure_artifact USING GIN (inputs_jsonb);
CREATE INDEX idx_lease_remeasure_artifact_calculations_jsonb ON lease_remeasure_artifact USING GIN (calculations_jsonb);
CREATE INDEX idx_lease_remeasure_artifact_outputs_jsonb ON lease_remeasure_artifact USING GIN (outputs_jsonb);

-- Comments for documentation
COMMENT ON TABLE lease_cpi_index IS 'CPI index values with lag policy for lease indexation';
COMMENT ON TABLE lease_remeasure_artifact IS 'Reproducible proof artifacts for lease remeasurements';
