BEGIN;
CREATE TABLE IF NOT EXISTS ar_remittance_import (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('CAMT054','CSV','EMAIL')),
  filename TEXT,
  uniq_hash TEXT NOT NULL,              -- dedupe
  rows_ok INT NOT NULL DEFAULT 0,
  rows_err INT NOT NULL DEFAULT 0,
  payload TEXT,                         -- raw
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ar_remit_import_uk ON ar_remittance_import(company_id, uniq_hash);
COMMIT;
