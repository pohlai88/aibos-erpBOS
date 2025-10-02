BEGIN;

CREATE TABLE IF NOT EXISTS tax_return_run (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  version      TEXT NOT NULL,
  year         INT NOT NULL,
  month        INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  period_key   TEXT NOT NULL,            -- e.g. '2025-11' or authority period
  mode         TEXT NOT NULL CHECK (mode IN ('dry_run','commit')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_return_line (
  id         TEXT PRIMARY KEY,
  run_id     TEXT NOT NULL REFERENCES tax_return_run(id) ON DELETE CASCADE,
  box_id     TEXT NOT NULL,
  amount     NUMERIC NOT NULL,
  note       TEXT
);

-- Optional fine-grain detail rows for audit (source doc/journal links)
CREATE TABLE IF NOT EXISTS tax_return_detail (
  id         TEXT PRIMARY KEY,
  run_id     TEXT NOT NULL REFERENCES tax_return_run(id) ON DELETE CASCADE,
  box_id     TEXT NOT NULL,
  source_ref TEXT,               -- invoice/journal id
  amount     NUMERIC NOT NULL
);

-- Prevent duplicate commit for same partner/period
CREATE TABLE IF NOT EXISTS tax_return_lock (
  company_id   TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  year         INT NOT NULL,
  month        INT NOT NULL,
  PRIMARY KEY (company_id, partner_code, year, month)
);

-- Manual adjustments table (one-off lines, posted as JEs on commit)
CREATE TABLE IF NOT EXISTS tax_return_adjustment (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  year         INT NOT NULL,
  month        INT NOT NULL,
  box_id       TEXT NOT NULL,
  amount       NUMERIC NOT NULL,     -- +/- allowed
  memo         TEXT,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

COMMIT;
