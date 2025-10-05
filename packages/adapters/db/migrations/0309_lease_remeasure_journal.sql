-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0309_lease_remeasure_journal.sql

-- lease_remeasure_post — remeasurement posting header
CREATE TABLE lease_remeasure_post (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    mod_id TEXT NOT NULL REFERENCES lease_mod(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    journal_entry_id TEXT NOT NULL,
    total_liability_delta NUMERIC(18,2) NOT NULL,
    total_rou_delta NUMERIC(18,2) NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    posted_by TEXT NOT NULL,
    UNIQUE(company_id, lease_id, mod_id, year, month)
);

-- lease_remeasure_post_lock — idempotency lock
CREATE TABLE lease_remeasure_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL,
    mod_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, lease_id, mod_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_lease_remeasure_post_company ON lease_remeasure_post(company_id);
CREATE INDEX idx_lease_remeasure_post_lease ON lease_remeasure_post(lease_id);
CREATE INDEX idx_lease_remeasure_post_mod ON lease_remeasure_post(mod_id);
CREATE INDEX idx_lease_remeasure_post_period ON lease_remeasure_post(year, month);
