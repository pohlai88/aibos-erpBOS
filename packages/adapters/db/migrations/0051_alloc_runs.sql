BEGIN;

CREATE TABLE IF NOT EXISTS alloc_run (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  year        INT NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  mode        TEXT NOT NULL CHECK (mode IN ('dry_run','commit')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alloc_line (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES alloc_run(id) ON DELETE CASCADE,
  rule_id       TEXT NOT NULL,
  src_account   TEXT,
  src_cc        TEXT,
  target_cc     TEXT NOT NULL,
  amount_base   NUMERIC NOT NULL,
  driver_code   TEXT,
  driver_value  NUMERIC,
  method        TEXT NOT NULL,
  note          TEXT
);

-- Prevent double commit of same rule per period
CREATE TABLE IF NOT EXISTS alloc_lock (
  company_id TEXT NOT NULL,
  year       INT NOT NULL,
  month      INT NOT NULL,
  rule_id    TEXT NOT NULL,
  PRIMARY KEY (company_id, year, month, rule_id)
);

COMMIT;
