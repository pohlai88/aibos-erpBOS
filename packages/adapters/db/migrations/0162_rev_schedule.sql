BEGIN;

-- Revenue Recognition Schedule (M25.1)
-- Recognition schedules and run tracking

CREATE TABLE rev_schedule (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  pob_id TEXT NOT NULL REFERENCES rev_pob(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  planned NUMERIC NOT NULL,                          -- planned recognition amount
  recognized NUMERIC NOT NULL DEFAULT 0,             -- actual recognized amount
  status TEXT NOT NULL CHECK (status IN ('PLANNED','PARTIAL','DONE')) DEFAULT 'PLANNED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, pob_id, year, month)
);

-- Recognition Run Headers
CREATE TABLE rev_rec_run (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  status TEXT NOT NULL CHECK (status IN ('DRAFT','POSTED','ERROR')) DEFAULT 'DRAFT',
  stats JSONB,                                      -- run statistics (counts, totals, etc.)
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  UNIQUE (company_id, period_year, period_month)
);

-- Recognition Lines (GL postings)
CREATE TABLE rev_rec_line (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES rev_rec_run(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  pob_id TEXT NOT NULL REFERENCES rev_pob(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC NOT NULL,                           -- recognition amount (positive)
  dr_account TEXT NOT NULL,                         -- debit account
  cr_account TEXT NOT NULL,                         -- credit account
  memo TEXT,                                         -- posting memo
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX rev_sched_idx ON rev_schedule(company_id, year, month, status);
CREATE INDEX rev_sched_pob_idx ON rev_schedule(company_id, pob_id, year, month);
CREATE INDEX rev_rec_run_idx ON rev_rec_run(company_id, period_year, period_month);
CREATE INDEX rev_rec_line_idx ON rev_rec_line(company_id, pob_id, year, month);
CREATE INDEX rev_rec_line_run_idx ON rev_rec_line(run_id);

COMMIT;
