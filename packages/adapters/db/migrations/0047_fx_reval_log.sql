BEGIN;

CREATE TABLE IF NOT EXISTS fx_reval_run (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  year         INT  NOT NULL,
  month        INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  mode         TEXT NOT NULL CHECK (mode IN ('dry_run','commit')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fx_reval_line (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES fx_reval_run(id) ON DELETE CASCADE,
  gl_account     TEXT NOT NULL,
  currency       TEXT NOT NULL,
  balance_base   NUMERIC NOT NULL,  -- base book balance (company base)
  balance_src    NUMERIC NOT NULL,  -- source monetary amount
  rate_old       NUMERIC NOT NULL,  -- book rate snapshot or 1
  rate_new       NUMERIC NOT NULL,  -- admin rate (as-of month end)
  delta_base     NUMERIC NOT NULL   -- (balance_src*rate_new - balance_src*rate_old)
);

-- Prevent duplicate commit revals per period/account/ccy
CREATE TABLE IF NOT EXISTS fx_reval_lock (
  company_id TEXT NOT NULL,
  year       INT  NOT NULL,
  month      INT  NOT NULL,
  gl_account TEXT NOT NULL,
  currency   TEXT NOT NULL,
  PRIMARY KEY (company_id, year, month, gl_account, currency)
);

COMMIT;
