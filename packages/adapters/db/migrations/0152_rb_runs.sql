BEGIN;

-- Revenue & Billing Runs Table
CREATE TABLE rb_billing_run (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  present_ccy TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','RATED','INVOICED','POSTED','ERROR')) DEFAULT 'DRAFT',
  stats JSONB,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);
CREATE INDEX rb_runs_idx ON rb_billing_run(company_id, period_end, status);

COMMIT;
