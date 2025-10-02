BEGIN;

CREATE TABLE IF NOT EXISTS cf_run (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  scope       TEXT NOT NULL CHECK (scope IN ('INDIRECT','DIRECT13')),
  year        INT NOT NULL,
  month       INT,                     -- for INDIRECT (monthly)
  start_date  DATE,                    -- for DIRECT13 (window start)
  mode        TEXT NOT NULL CHECK (mode IN ('dry_run','commit')),
  present_ccy TEXT,                    -- presentation currency
  scenario    TEXT,                    -- overlay used
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cf_line (
  id        TEXT PRIMARY KEY,
  run_id    TEXT NOT NULL REFERENCES cf_run(id) ON DELETE CASCADE,
  label     TEXT NOT NULL,             -- section/bucket label
  period    TEXT NOT NULL,             -- 'YYYY-MM' or 'YYYY-Wnn'
  amount    NUMERIC NOT NULL,
  note      TEXT
);

CREATE TABLE IF NOT EXISTS cf_lock (
  company_id TEXT NOT NULL,
  scope      TEXT NOT NULL,
  key        TEXT NOT NULL,            -- 'YYYY-MM' or 'YYYY-Wnn:13'
  PRIMARY KEY (company_id, scope, key)
);

COMMIT;
