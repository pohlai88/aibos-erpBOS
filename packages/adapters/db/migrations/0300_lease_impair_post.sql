-- M28.3: Componentized ROU & Impairment - Impairment Posting
-- Migration: 0300_lease_impair_post.sql

-- lease_impair_post — posting header (references period + lock)
CREATE TABLE lease_impair_post (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    impair_test_id TEXT NOT NULL REFERENCES lease_impair_test(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    journal_entry_id TEXT, -- references GL journal entry
    total_loss NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_reversal NUMERIC(18,2) NOT NULL DEFAULT 0,
    posted_by TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, year, month, impair_test_id)
);

-- lease_impair_post_lock — idempotency lock (unique(company_id,year,month,impair_test_id))
CREATE TABLE lease_impair_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    impair_test_id TEXT NOT NULL REFERENCES lease_impair_test(id) ON DELETE CASCADE,
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, year, month, impair_test_id)
);

-- Indexes for performance
CREATE INDEX idx_lease_impair_post_company_period ON lease_impair_post(company_id, year, month);
CREATE INDEX idx_lease_impair_post_test ON lease_impair_post(impair_test_id);
CREATE INDEX idx_lease_impair_post_lock_company_period ON lease_impair_post_lock(company_id, year, month);
CREATE INDEX idx_lease_impair_post_lock_test ON lease_impair_post_lock(impair_test_id);
