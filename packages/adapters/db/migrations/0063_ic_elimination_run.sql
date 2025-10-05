BEGIN;

CREATE TABLE IF NOT EXISTS ic_elim_run (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  group_code  TEXT NOT NULL,
  year        INT NOT NULL,
  month       INT NOT NULL,
  mode        TEXT NOT NULL CHECK (mode IN ('dry_run','commit')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ic_elim_lock (
  company_id TEXT NOT NULL,
  group_code TEXT NOT NULL,
  year       INT NOT NULL,
  month      INT NOT NULL,
  PRIMARY KEY (company_id, group_code, year, month)
);

CREATE TABLE IF NOT EXISTS ic_elim_line (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL REFERENCES ic_elim_run(id) ON DELETE CASCADE,
  entity_code TEXT NOT NULL,
  cp_code     TEXT NOT NULL,
  amount_base NUMERIC NOT NULL,
  note        TEXT
);

COMMIT;
