BEGIN;

-- CTA configuration & retained-earnings link
CREATE TABLE IF NOT EXISTS consol_cta_policy (
  company_id TEXT NOT NULL PRIMARY KEY,
  cta_account TEXT NOT NULL,            -- where CTA balances go
  re_account  TEXT NOT NULL,            -- retained earnings for NI close
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);

COMMIT;
