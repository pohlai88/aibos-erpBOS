-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0311_lease_sched_delta.sql

-- lease_component_sched_delta — overlays on top of base & component schedule for audit
CREATE TABLE lease_component_sched_delta (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    mod_id TEXT NOT NULL REFERENCES lease_mod(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    liab_delta NUMERIC(18,2) NOT NULL DEFAULT 0,
    rou_delta NUMERIC(18,2) NOT NULL DEFAULT 0,
    interest_delta NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lease_component_id, mod_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_lease_sched_delta_component ON lease_component_sched_delta(lease_component_id);
CREATE INDEX idx_lease_sched_delta_mod ON lease_component_sched_delta(mod_id);
CREATE INDEX idx_lease_sched_delta_period ON lease_component_sched_delta(year, month);
CREATE INDEX idx_lease_sched_delta_component_period ON lease_component_sched_delta(lease_component_id, year, month);
