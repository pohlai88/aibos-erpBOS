BEGIN;

CREATE TABLE IF NOT EXISTS ar_receipt_email (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  intent_id  TEXT NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  to_addr    TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('sent','error')),
  error      TEXT
);

COMMIT;
