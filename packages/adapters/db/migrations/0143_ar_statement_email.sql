BEGIN;
CREATE TABLE IF NOT EXISTS ar_statement_email (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL REFERENCES ar_statement_run(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  to_addr     TEXT NOT NULL,
  sent_at     timestamptz,
  status      TEXT NOT NULL CHECK (status IN ('queued','sent','error')) DEFAULT 'queued',
  error       TEXT
);
CREATE INDEX IF NOT EXISTS ar_stmt_email_idx ON ar_statement_email(run_id, status);
COMMIT;
