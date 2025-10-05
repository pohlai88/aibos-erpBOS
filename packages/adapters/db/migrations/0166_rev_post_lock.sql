BEGIN;

-- Revenue Recognition Post Lock (M25.1)
-- Prevents duplicate recognition runs for the same period

CREATE TABLE rev_post_lock (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  posted_at timestamptz NOT NULL DEFAULT now(),
  posted_by TEXT NOT NULL,
  UNIQUE(company_id, year, month)
);

-- Indexes for performance
CREATE INDEX rev_post_lock_idx ON rev_post_lock(company_id, year, month);

COMMIT;
