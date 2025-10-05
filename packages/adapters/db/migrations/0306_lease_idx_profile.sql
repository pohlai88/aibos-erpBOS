-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0306_lease_idx_profile.sql

-- lease_index_profile — index master per lease (or null if fixed)
CREATE TABLE lease_index_profile (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    index_code TEXT NOT NULL, -- CPI index code (e.g., CPI-US, CPI-UK)
    lag_months INTEGER NOT NULL DEFAULT 0, -- publication lag in months
    cap_pct NUMERIC(7,4), -- maximum increase percentage (null = no cap)
    floor_pct NUMERIC(7,4), -- minimum increase percentage (null = no floor)
    fx_src_ccy CHAR(3), -- source currency for FX-indexed leases
    reset_freq TEXT NOT NULL CHECK (reset_freq IN ('M', 'Q', 'SA', 'A')), -- Monthly, Quarterly, Semi-Annual, Annual
    next_reset_on DATE NOT NULL,
    last_index_value NUMERIC(16,8), -- last applied index value
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    UNIQUE(lease_id, index_code)
);

-- Indexes for performance
CREATE INDEX idx_lease_index_profile_company ON lease_index_profile(company_id);
CREATE INDEX idx_lease_index_profile_lease ON lease_index_profile(lease_id);
CREATE INDEX idx_lease_index_profile_next_reset ON lease_index_profile(next_reset_on);
CREATE INDEX idx_lease_index_profile_index_code ON lease_index_profile(index_code);
