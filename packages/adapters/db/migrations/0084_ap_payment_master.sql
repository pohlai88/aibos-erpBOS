BEGIN;

CREATE TABLE IF NOT EXISTS ap_supplier_bank (
  company_id   TEXT NOT NULL,
  supplier_id  TEXT NOT NULL,
  method       TEXT NOT NULL CHECK (method IN ('ACH','SEPA','TT','MANUAL')),
  bank_name    TEXT,
  iban         TEXT,
  bic          TEXT,
  acct_no      TEXT,
  acct_ccy     TEXT NOT NULL,
  country      TEXT,
  active       BOOLEAN NOT NULL DEFAULT true,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS ap_payment_pref (
  company_id   TEXT NOT NULL,
  supplier_id  TEXT NOT NULL,
  pay_terms    TEXT,                  -- e.g., 'NET30'
  pay_day_rule TEXT,                  -- e.g., 'MON,THU'
  min_amount   NUMERIC,               -- batching threshold
  hold_pay     BOOLEAN NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, supplier_id)
);

COMMIT;
