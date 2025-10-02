BEGIN;
CREATE TABLE IF NOT EXISTS bank_inbox_audit (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  bank_code  TEXT NOT NULL,
  channel    TEXT NOT NULL CHECK (channel IN ('pain002','camt054')),
  filename   TEXT NOT NULL,
  uniq_hash  TEXT NOT NULL,
  stored_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bank_inbox_audit_uk ON bank_inbox_audit(company_id, bank_code, uniq_hash);
COMMIT;
