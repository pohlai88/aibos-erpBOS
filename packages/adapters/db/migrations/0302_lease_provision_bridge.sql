-- M28.3: Componentized ROU & Impairment - Restoration Provisions Bridge
-- Migration: 0302_lease_provision_bridge.sql

-- lease_restoration_prov — restoration provisions tracking (if not already exists)
CREATE TABLE lease_restoration_prov (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- nullable for lease-level provisions
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    opening NUMERIC(18,2) NOT NULL DEFAULT 0,
    additions NUMERIC(18,2) NOT NULL DEFAULT 0,
    unwind_interest NUMERIC(18,2) NOT NULL DEFAULT 0,
    utilizations NUMERIC(18,2) NOT NULL DEFAULT 0,
    remeasurements NUMERIC(18,2) NOT NULL DEFAULT 0,
    closing NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, lease_id, component_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_lease_restoration_prov_company_period ON lease_restoration_prov(company_id, year, month);
CREATE INDEX idx_lease_restoration_prov_lease ON lease_restoration_prov(lease_id);
CREATE INDEX idx_lease_restoration_prov_component ON lease_restoration_prov(component_id);
CREATE INDEX idx_lease_restoration_prov_lease_period ON lease_restoration_prov(lease_id, year, month);
