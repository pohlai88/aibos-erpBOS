BEGIN;
CREATE TABLE IF NOT EXISTS ar_portal_ledger_token (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  customer_id  TEXT NOT NULL,
  token        TEXT NOT NULL,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ar_portal_ledger_token_uk ON ar_portal_ledger_token(token);
COMMIT;
