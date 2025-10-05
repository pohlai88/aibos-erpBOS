-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0308_lease_idx_values.sql

-- lease_index_value — CPI table or FX proxy
CREATE TABLE lease_index_value (
    company_id TEXT NOT NULL,
    index_code TEXT NOT NULL,
    index_date DATE NOT NULL,
    value NUMERIC(16,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY(company_id, index_code, index_date)
);

-- Indexes for performance
CREATE INDEX idx_lease_index_value_company_code ON lease_index_value(company_id, index_code);
CREATE INDEX idx_lease_index_value_date ON lease_index_value(index_date);
