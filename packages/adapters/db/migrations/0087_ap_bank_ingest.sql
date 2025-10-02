BEGIN;

CREATE TABLE IF NOT EXISTS bank_file_import (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('CAMT053','CSV')),
  filename   TEXT NOT NULL,
  payload    TEXT NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  uniq_hash  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS bank_file_import_uk ON bank_file_import(company_id, uniq_hash);

CREATE TABLE IF NOT EXISTS bank_txn_map (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  bank_date  DATE NOT NULL,
  amount     NUMERIC NOT NULL,
  ccy        TEXT NOT NULL,
  counterparty TEXT,
  memo       TEXT,
  matched_run_id TEXT,                  -- ap_pay_run.id
  matched_line_id TEXT,                 -- ap_pay_line.id
  status     TEXT NOT NULL CHECK (status IN ('unmatched','matched','partial')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
