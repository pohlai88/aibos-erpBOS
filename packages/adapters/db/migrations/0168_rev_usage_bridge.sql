BEGIN;

-- Revenue Recognition Usage Bridge (M25.1)
-- Bridges usage-based billing to revenue recognition

CREATE TABLE rev_usage_bridge (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  pob_id TEXT NOT NULL REFERENCES rev_pob(id) ON DELETE CASCADE,
  rollup_id TEXT NOT NULL,                          -- references usage rollup/aggregation
  qty NUMERIC NOT NULL,                             -- usage quantity
  rated_amount NUMERIC NOT NULL,                    -- rated amount for recognition
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, pob_id, rollup_id)
);

-- Indexes for performance
CREATE INDEX rev_usage_bridge_idx ON rev_usage_bridge(company_id, pob_id, period_year, period_month);
CREATE INDEX rev_usage_rollup_idx ON rev_usage_bridge(company_id, rollup_id);

COMMIT;
