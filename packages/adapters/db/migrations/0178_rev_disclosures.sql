BEGIN;

-- Revenue Disclosures (M25.2)
-- Modification Register for audit/reporting
CREATE TABLE rev_mod_register (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  change_order_id TEXT NOT NULL REFERENCES rev_change_order(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  txn_price_before NUMERIC NOT NULL,
  txn_price_after NUMERIC NOT NULL,
  txn_price_delta NUMERIC NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- VC Rollforward for period summaries
CREATE TABLE rev_vc_rollforward (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  pob_id TEXT NOT NULL,                           -- references future POB table
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  opening_balance NUMERIC NOT NULL DEFAULT 0,     -- VC balance at start of period
  additions NUMERIC NOT NULL DEFAULT 0,          -- new VC estimates
  changes NUMERIC NOT NULL DEFAULT 0,            -- changes to existing estimates
  releases NUMERIC NOT NULL DEFAULT 0,           -- VC resolved and recognized
  recognized NUMERIC NOT NULL DEFAULT 0,         -- VC recognized in revenue
  closing_balance NUMERIC NOT NULL DEFAULT 0,    -- VC balance at end of period
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_mr_idx ON rev_mod_register(company_id, contract_id, effective_date);
CREATE INDEX rev_vcr_idx ON rev_vc_rollforward(company_id, contract_id, pob_id, year, month);

COMMIT;
