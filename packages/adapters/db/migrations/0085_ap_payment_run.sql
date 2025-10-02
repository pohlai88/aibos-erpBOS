BEGIN;

CREATE TABLE IF NOT EXISTS ap_pay_run (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  year        INT NOT NULL,
  month       INT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('draft','approved','exported','executed','failed','cancelled')),
  ccy         TEXT NOT NULL,           -- disbursement currency
  present_ccy TEXT,                    -- optional present currency view
  created_by  TEXT NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS ap_pay_line (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES ap_pay_run(id) ON DELETE CASCADE,
  supplier_id   TEXT NOT NULL,
  invoice_id    TEXT NOT NULL,
  due_date      DATE NOT NULL,
  gross_amount  NUMERIC NOT NULL,      -- invoice currency
  disc_amount   NUMERIC NOT NULL DEFAULT 0,
  pay_amount    NUMERIC NOT NULL,      -- invoice currency
  inv_ccy       TEXT NOT NULL,
  pay_ccy       TEXT NOT NULL,
  fx_rate       NUMERIC,               -- applied rate if cross-ccy
  bank_ref      TEXT,                  -- remittance reference
  status        TEXT NOT NULL CHECK (status IN ('selected','held','paid','failed')),
  note          TEXT
);

-- idempotency: prevent double-adding the same invoice to open runs
CREATE UNIQUE INDEX IF NOT EXISTS ap_pay_line_uk
ON ap_pay_line(run_id, invoice_id);

COMMIT;
