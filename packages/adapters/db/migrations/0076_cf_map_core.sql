BEGIN;

-- Indirect cashflow mapping (PL/BS accounts → CF section)
CREATE TABLE IF NOT EXISTS cf_map (
  company_id   TEXT NOT NULL,
  map_code     TEXT NOT NULL,          -- e.g., 'IFRS-INDIRECT'
  account_like TEXT NOT NULL,          -- pattern, e.g., '1%' or '7400'
  cf_section   TEXT NOT NULL,          -- 'OPERATING','INVESTING','FINANCING','NONCASH'
  sign         TEXT NOT NULL CHECK (sign IN ('+','-')), -- contribution sign
  note         TEXT,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, map_code, account_like)
);

-- Scenario layer registry (for CF overlay)
CREATE TABLE IF NOT EXISTS cf_scenario (
  company_id   TEXT NOT NULL,
  code         TEXT NOT NULL,          -- e.g., 'BASE', 'BUD25', 'FORECAST:Q3'
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('BASE','BUDGET','FORECAST','MANUAL')),
  active       BOOLEAN NOT NULL DEFAULT true,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, code)
);

COMMIT;
