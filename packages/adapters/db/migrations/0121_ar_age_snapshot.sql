BEGIN;
CREATE TABLE IF NOT EXISTS ar_age_snapshot (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  bucket TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  open_amt NUMERIC NOT NULL
);
CREATE INDEX IF NOT EXISTS ar_age_snap_idx ON ar_age_snapshot(company_id, as_of_date, bucket);
COMMIT;
