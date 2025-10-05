-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0307_lease_mod_core.sql

-- lease_mod — modification header
CREATE TABLE lease_mod (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    effective_on DATE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('INDEXATION', 'CONCESSION', 'SCOPE', 'TERM')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'APPLIED', 'POSTED')) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- lease_mod_line — modification line items
CREATE TABLE lease_mod_line (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mod_id TEXT NOT NULL REFERENCES lease_mod(id) ON DELETE CASCADE,
    lease_component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- null for lease-level changes
    action TEXT NOT NULL CHECK (action IN ('INCREASE', 'DECREASE', 'RENT_FREE', 'DEFERRAL', 'EXTEND', 'SHORTEN', 'RATE_RESET', 'AREA_CHANGE')),
    qty_delta NUMERIC(18,6), -- quantity change (for area/scope modifications)
    amount_delta NUMERIC(18,2), -- amount change
    notes JSONB, -- additional details
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lease_mod_company ON lease_mod(company_id);
CREATE INDEX idx_lease_mod_lease ON lease_mod(lease_id);
CREATE INDEX idx_lease_mod_effective ON lease_mod(effective_on);
CREATE INDEX idx_lease_mod_status ON lease_mod(status);
CREATE INDEX idx_lease_mod_line_mod ON lease_mod_line(mod_id);
CREATE INDEX idx_lease_mod_line_component ON lease_mod_line(lease_component_id);
