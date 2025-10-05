BEGIN;

-- Revenue Recognition Catch-up (M25.2)
-- Tracks catch-up revenue from retrospective changes
CREATE TABLE rev_rec_catchup (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,                          -- references future rev_rec_run table
  pob_id TEXT NOT NULL,                           -- references future POB table
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  catchup_amount NUMERIC NOT NULL,               -- positive or negative catch-up
  dr_account TEXT NOT NULL,                       -- debit account
  cr_account TEXT NOT NULL,                       -- credit account
  memo TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_rc_idx ON rev_rec_catchup(run_id, pob_id, year, month);

COMMIT;
