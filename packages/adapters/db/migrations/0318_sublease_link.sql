-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Sublease Links
-- Migration: 0318_sublease_link.sql

-- lease_component_sublet — ties head-lease component to sublease proportion
CREATE TABLE lease_component_sublet (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    sublease_id TEXT NOT NULL REFERENCES sublease(id) ON DELETE CASCADE,
    proportion NUMERIC(7,4) NOT NULL CHECK (proportion >= 0 AND proportion <= 1), -- proportion of component sublet
    method TEXT NOT NULL CHECK (method IN ('PROPORTIONATE', 'SPECIFIC')) DEFAULT 'PROPORTIONATE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    UNIQUE(lease_component_id, sublease_id)
);

-- Indexes for performance
CREATE INDEX idx_lease_component_sublet_component ON lease_component_sublet(lease_component_id);
CREATE INDEX idx_lease_component_sublet_sublease ON lease_component_sublet(sublease_id);
CREATE INDEX idx_lease_component_sublet_proportion ON lease_component_sublet(proportion);
