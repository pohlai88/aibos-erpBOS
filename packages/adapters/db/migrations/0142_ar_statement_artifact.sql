BEGIN;
CREATE TABLE IF NOT EXISTS ar_statement_artifact (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL REFERENCES ar_statement_run(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('PDF','CSV')),
  filename    TEXT NOT NULL,
  sha256      TEXT NOT NULL,
  bytes       INT NOT NULL,
  storage_uri TEXT NOT NULL,             -- e.g., s3://... or file://...
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ar_stmt_art_idx ON ar_statement_artifact(run_id, customer_id);
COMMIT;
