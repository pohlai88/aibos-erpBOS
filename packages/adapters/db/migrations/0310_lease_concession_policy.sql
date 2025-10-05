-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0310_lease_concession_policy.sql

-- lease_concession_policy — choose accounting route where criteria are met
CREATE TABLE lease_concession_policy (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('STRAIGHT_LINE', 'TRUE_MOD')),
    component_alloc TEXT NOT NULL CHECK (component_alloc IN ('PRORATA', 'TARGETED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    UNIQUE(company_id)
);

-- Indexes for performance
CREATE INDEX idx_lease_concession_policy_company ON lease_concession_policy(company_id);
