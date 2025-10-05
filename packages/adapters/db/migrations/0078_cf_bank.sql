BEGIN;

CREATE TABLE IF NOT EXISTS bank_account (
  company_id TEXT NOT NULL,
  acct_code  TEXT NOT NULL,           -- internal code
  name       TEXT NOT NULL,
  ccy        TEXT NOT NULL,
  PRIMARY KEY (company_id, acct_code)
);

CREATE TABLE IF NOT EXISTS bank_balance_day (
  company_id TEXT NOT NULL,
  acct_code  TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  balance    NUMERIC NOT NULL,        -- end-of-day balance in acct ccy
  PRIMARY KEY (company_id, acct_code, as_of_date)
);

CREATE TABLE IF NOT EXISTS bank_txn_import (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  acct_code  TEXT NOT NULL,
  txn_date   DATE NOT NULL,
  amount     NUMERIC NOT NULL,        -- signed in acct ccy
  memo       TEXT,
  source     TEXT,                    -- 'CSV','API'
  imported_at timestamptz NOT NULL DEFAULT now(),
  uniq_hash  TEXT NOT NULL            -- idempotency
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_txn_import_uk ON bank_txn_import(company_id, acct_code, uniq_hash);

COMMIT;
