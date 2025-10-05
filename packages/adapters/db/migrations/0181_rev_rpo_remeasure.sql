BEGIN;

-- RPO Remeasurement Extensions (M25.2)
-- Extend future RPO snapshot table with revision tracking

-- Note: This migration assumes a future rev_rpo_snapshot table will be created
-- in M25.1. For now, we'll create a placeholder that can be extended later.

-- Placeholder RPO snapshot table (to be properly implemented in M25.1)
CREATE TABLE IF NOT EXISTS rev_rpo_snapshot (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  pob_id TEXT NOT NULL,                           -- references future POB table
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  rpo_amount NUMERIC NOT NULL DEFAULT 0,          -- remaining performance obligation
  delta_from_revisions NUMERIC NOT NULL DEFAULT 0, -- delta from contract modifications
  delta_from_vc NUMERIC NOT NULL DEFAULT 0,       -- delta from variable consideration
  notes TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  UNIQUE (company_id, contract_id, pob_id, year, month)
);

-- Indexes for RPO lookups
CREATE INDEX rev_rpo_idx ON rev_rpo_snapshot(company_id, contract_id, pob_id, year, month);
CREATE INDEX rev_rpo_period_idx ON rev_rpo_snapshot(year, month);

COMMIT;
