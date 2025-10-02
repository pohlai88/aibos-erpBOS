BEGIN;
CREATE TABLE IF NOT EXISTS cf_import_audit (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('BANK_TXN','DRIVER')),
  filename   TEXT,
  rows_ok    INT NOT NULL,
  rows_err   INT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);
COMMIT;
