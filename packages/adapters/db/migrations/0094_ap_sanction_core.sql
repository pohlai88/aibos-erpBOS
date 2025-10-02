BEGIN;

CREATE TABLE IF NOT EXISTS sanction_denylist (
  company_id  TEXT NOT NULL,
  name_norm   TEXT NOT NULL,   -- normalized upper, no punctuation
  country     TEXT,
  source      TEXT,            -- 'LOCAL','OFAC','EU','UN'
  listed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, name_norm, COALESCE(country,''))
);

CREATE TABLE IF NOT EXISTS sanction_screen_run (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  run_id      TEXT,            -- optional: payment run screened
  supplier_id TEXT,            -- optional: single supplier screening
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sanction_hit (
  id          TEXT PRIMARY KEY,
  screen_id   TEXT NOT NULL REFERENCES sanction_screen_run(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  name_norm   TEXT NOT NULL,
  match_score NUMERIC NOT NULL, -- 0..1
  source      TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('potential','cleared','blocked')),
  decided_by  TEXT,
  decided_at  timestamptz,
  reason      TEXT
);

COMMIT;
