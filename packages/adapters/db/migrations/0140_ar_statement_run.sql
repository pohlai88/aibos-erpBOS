BEGIN;
CREATE TABLE IF NOT EXISTS ar_statement_run (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  as_of_date   DATE NOT NULL,
  policy_code  TEXT,                  -- dunning/segment policy snapshot if used
  present_ccy  TEXT NOT NULL,         -- statement currency
  status       TEXT NOT NULL CHECK (status IN ('draft','finalized','emailed','error')) DEFAULT 'draft',
  totals_json  JSONB,                 -- summary metrics
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ar_stmt_run_idx ON ar_statement_run(company_id, as_of_date);
COMMIT;
