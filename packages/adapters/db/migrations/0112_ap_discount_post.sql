BEGIN;

CREATE TABLE IF NOT EXISTS ap_discount_post (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  run_id      TEXT NOT NULL,
  total_savings NUMERIC NOT NULL,
  journal_id  TEXT,
  posted_at   timestamptz,
  posted_by   TEXT
);

COMMIT;

