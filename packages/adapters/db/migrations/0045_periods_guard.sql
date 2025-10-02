BEGIN;

CREATE TABLE IF NOT EXISTS periods (
  company_id TEXT NOT NULL,
  year       INT  NOT NULL,
  month      INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  state      TEXT NOT NULL CHECK (state IN ('open','pending_close','closed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, year, month)
);

CREATE INDEX IF NOT EXISTS periods_nonopen_idx
  ON periods(company_id, year, month)
  WHERE state <> 'open';

COMMIT;