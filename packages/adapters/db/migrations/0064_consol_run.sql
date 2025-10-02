BEGIN;

CREATE TABLE IF NOT EXISTS consol_run (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  group_code   TEXT NOT NULL,
  year         INT NOT NULL,
  month        INT NOT NULL,
  mode         TEXT NOT NULL CHECK (mode IN ('dry_run','commit')),
  present_ccy  TEXT NOT NULL,          -- group presentation ccy
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consol_lock (
  company_id TEXT NOT NULL,
  group_code TEXT NOT NULL,
  year       INT NOT NULL,
  month      INT NOT NULL,
  PRIMARY KEY (company_id, group_code, year, month)
);

-- Summary lines for audit (per component)
CREATE TABLE IF NOT EXISTS consol_summary (
  id           TEXT PRIMARY KEY,
  run_id       TEXT NOT NULL REFERENCES consol_run(id) ON DELETE CASCADE,
  component    TEXT NOT NULL,          -- 'TRANSLATION','IC_ELIM','MINORITY'
  label        TEXT NOT NULL,
  amount       NUMERIC NOT NULL
);

COMMIT;
