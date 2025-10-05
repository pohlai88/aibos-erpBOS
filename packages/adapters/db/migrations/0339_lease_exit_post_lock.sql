-- M28.7: Lease Derecognition - Post Lock for Idempotency
-- Migration: 0339_lease_exit_post_lock.sql

-- lease_exit_post_lock — idempotent posting control
CREATE TABLE lease_exit_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT REFERENCES lease(id) ON DELETE CASCADE, -- nullable for company-wide locks
    component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- nullable for lease-level locks
    event_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('LOCKED', 'POSTING', 'POSTED', 'ERROR')) DEFAULT 'LOCKED',
    journal_id TEXT, -- reference to posted journal
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by TEXT,
    error_msg TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, lease_id, component_id, event_date)
);

-- Indexes for performance
CREATE INDEX idx_lease_exit_post_lock_company_date ON lease_exit_post_lock(company_id, event_date);
CREATE INDEX idx_lease_exit_post_lock_lease ON lease_exit_post_lock(lease_id);
CREATE INDEX idx_lease_exit_post_lock_component ON lease_exit_post_lock(component_id);
CREATE INDEX idx_lease_exit_post_lock_status ON lease_exit_post_lock(status);

-- Comments for documentation
COMMENT ON TABLE lease_exit_post_lock IS 'Idempotent posting control for lease exits to prevent double-posting';
COMMENT ON COLUMN lease_exit_post_lock.lease_id IS 'Lease ID (nullable for company-wide exit locks)';
COMMENT ON COLUMN lease_exit_post_lock.component_id IS 'Component ID (nullable for lease-level exit locks)';
COMMENT ON COLUMN lease_exit_post_lock.journal_id IS 'Reference to the posted journal entry';
COMMENT ON COLUMN lease_exit_post_lock.error_msg IS 'Error message if posting failed';
