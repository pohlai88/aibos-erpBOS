BEGIN;
CREATE TABLE IF NOT EXISTS tax_return_export (
  id           TEXT PRIMARY KEY,
  run_id       TEXT NOT NULL REFERENCES tax_return_run(id) ON DELETE CASCADE,
  format       TEXT NOT NULL,         -- 'CSV','XML','JSON'
  filename     TEXT NOT NULL,
  payload      TEXT NOT NULL,         -- serialized export
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMIT;
