BEGIN;
CREATE TABLE IF NOT EXISTS comm_template (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('AR_DUNNING','AR_REMIND','AR_PTP')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,            -- handlebars variables
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);
COMMIT;
