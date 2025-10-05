BEGIN;

CREATE TABLE IF NOT EXISTS ap_discount_run (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  present_ccy TEXT,
  status      TEXT NOT NULL CHECK (status IN ('dry_run','committed')),
  window_from DATE NOT NULL,
  window_to   DATE NOT NULL,
  cash_cap    NUMERIC,                   -- optional cap in present ccy
  created_by  TEXT NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ap_discount_line (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES ap_discount_run(id) ON DELETE CASCADE,
  invoice_id    TEXT NOT NULL,
  supplier_id   TEXT NOT NULL,
  inv_ccy       TEXT NOT NULL,
  pay_ccy       TEXT NOT NULL,
  base_amount   NUMERIC NOT NULL,        -- gross due
  discount_amt  NUMERIC NOT NULL,        -- expected savings
  early_pay_amt NUMERIC NOT NULL,        -- amount to pay if accepted
  apr           NUMERIC NOT NULL,        -- annualized yield
  pay_by_date   DATE NOT NULL,           -- take discount if paid by
  selected      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS ap_discount_line_apr_idx ON ap_discount_line(run_id, selected DESC, apr DESC);

COMMIT;

