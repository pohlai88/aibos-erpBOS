BEGIN;

-- Revenue Recognition RPO Snapshot (M25.1)
-- Remaining Performance Obligation snapshots for disclosures

CREATE TABLE rev_rpo_snapshot (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  currency TEXT NOT NULL,
  total_rpo NUMERIC NOT NULL DEFAULT 0,             -- total remaining performance obligation
  due_within_12m NUMERIC NOT NULL DEFAULT 0,        -- RPO due within 12 months
  due_after_12m NUMERIC NOT NULL DEFAULT 0,         -- RPO due after 12 months
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  UNIQUE (company_id, as_of_date, currency)
);

-- Indexes for performance
CREATE INDEX rev_rpo_idx ON rev_rpo_snapshot(company_id, as_of_date);
CREATE INDEX rev_rpo_date_idx ON rev_rpo_snapshot(as_of_date);

COMMIT;
