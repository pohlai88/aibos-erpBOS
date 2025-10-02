BEGIN;

-- Allocation rules (company-scoped)
CREATE TABLE IF NOT EXISTS alloc_rule (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  code         TEXT NOT NULL,         -- human handle / external ID
  name         TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true,
  method       TEXT NOT NULL CHECK (method IN ('PERCENT','RATE_PER_UNIT','DRIVER_SHARE')),
  driver_code  TEXT,                   -- for RATE_PER_UNIT or DRIVER_SHARE
  rate_per_unit NUMERIC,               -- for RATE_PER_UNIT
  src_account  TEXT,                   -- optional filter (one account or pattern)
  src_cc_like  TEXT,                   -- optional pattern (e.g., 'IT%')
  src_project  TEXT,                   -- optional
  eff_from     DATE,                   -- effective window
  eff_to       DATE,
  order_no     INT NOT NULL DEFAULT 1, -- run order
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS alloc_rule_company_code_uk
ON alloc_rule(company_id, code);

-- Fixed percent targets (for method=PERCENT)
CREATE TABLE IF NOT EXISTS alloc_rule_target (
  rule_id     TEXT NOT NULL REFERENCES alloc_rule(id) ON DELETE CASCADE,
  target_cc   TEXT NOT NULL,
  percent     NUMERIC NOT NULL,     -- 0..1
  PRIMARY KEY (rule_id, target_cc)
);

-- Driver values by period + CC/Project
CREATE TABLE IF NOT EXISTS alloc_driver_value (
  company_id  TEXT NOT NULL,
  driver_code TEXT NOT NULL,
  year        INT NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  cost_center TEXT,                  -- nullable if driver is project-based
  project     TEXT,
  value       NUMERIC NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (company_id, driver_code, year, month, cost_center, project)
);

COMMIT;
