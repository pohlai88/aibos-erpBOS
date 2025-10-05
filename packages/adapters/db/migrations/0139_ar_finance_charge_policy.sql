BEGIN;
CREATE TABLE IF NOT EXISTS ar_finance_charge_policy (
  company_id   TEXT PRIMARY KEY,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  annual_pct   NUMERIC NOT NULL DEFAULT 0,   -- APR, e.g., 0.18 = 18%
  min_fee      NUMERIC NOT NULL DEFAULT 0,
  grace_days   INT NOT NULL DEFAULT 0,       -- days past due before accrual
  comp_method  TEXT NOT NULL DEFAULT 'simple' CHECK (comp_method IN ('simple','daily')),
  present_ccy  TEXT,                         -- if finance charge presented in this currency
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL
);
COMMIT;
