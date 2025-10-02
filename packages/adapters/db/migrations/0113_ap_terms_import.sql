BEGIN;

CREATE TABLE IF NOT EXISTS ap_terms_import (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  filename   TEXT,
  rows_ok    INT NOT NULL,
  rows_err   INT NOT NULL,
  payload    TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

COMMIT;

