BEGIN;

-- Variable Consideration Estimation (M25.2)
-- VC Policy per Company
CREATE TABLE rev_vc_policy (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  default_method TEXT NOT NULL CHECK (default_method IN ('EXPECTED_VALUE','MOST_LIKELY')),
  constraint_probability_threshold NUMERIC NOT NULL DEFAULT 0.5,
  volatility_lookback_months INTEGER NOT NULL DEFAULT 12,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  UNIQUE (company_id)
);

-- VC Estimates by Contract/POB/Month
CREATE TABLE rev_vc_estimate (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  pob_id TEXT NOT NULL,                           -- references future POB table
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  method TEXT NOT NULL CHECK (method IN ('EXPECTED_VALUE','MOST_LIKELY')),
  raw_estimate NUMERIC NOT NULL,                 -- unconstrained estimate
  constrained_amount NUMERIC NOT NULL,            -- after constraint applied
  confidence NUMERIC NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  status TEXT NOT NULL CHECK (status IN ('OPEN','RESOLVED')) DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  UNIQUE (company_id, contract_id, pob_id, year, month)
);

-- Indexes for performance
CREATE INDEX rev_vc_policy_idx ON rev_vc_policy(company_id);
CREATE INDEX rev_vc_est_idx ON rev_vc_estimate(company_id, contract_id, pob_id, year, month, status);

COMMIT;
