BEGIN;

-- Jurisdiction/partner config (per company)
CREATE TABLE IF NOT EXISTS tax_partner (
  company_id   TEXT NOT NULL,
  code         TEXT NOT NULL,         -- e.g. 'MY-SST', 'UK-VAT'
  name         TEXT NOT NULL,
  frequency    TEXT NOT NULL CHECK (frequency IN ('M','Q','Y')), -- filing frequency
  base_ccy     TEXT NOT NULL,         -- reporting currency
  PRIMARY KEY (company_id, code)
);

-- Return template (boxes)
CREATE TABLE IF NOT EXISTS tax_return_template (
  company_id   TEXT NOT NULL,
  partner_code TEXT NOT NULL,      -- FK to tax_partner
  version      TEXT NOT NULL,      -- jurisdiction version e.g. '2024-01'
  box_id       TEXT NOT NULL,      -- e.g. '5a', '6', 'SR-SALES'
  box_label    TEXT NOT NULL,
  sign         TEXT NOT NULL CHECK (sign IN ('+','-')), -- contribution sign
  ordinal      INT NOT NULL,       -- order in UI/export
  PRIMARY KEY (company_id, partner_code, version, box_id)
);

-- Box mapping rules: how to derive box totals from GL/tax meta
CREATE TABLE IF NOT EXISTS tax_return_box_map (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  version      TEXT NOT NULL,
  box_id       TEXT NOT NULL,
  -- matching attributes from your existing tax engine:
  tax_code     TEXT,             -- specific tax_code OR NULL
  direction    TEXT,             -- 'OUTPUT'|'INPUT' OR NULL
  rate_name    TEXT,             -- e.g. 'SR','ZR','EXEMPT' OR NULL
  account_like TEXT,             -- optional GL account LIKE pattern
  cc_like      TEXT,             -- optional cost center LIKE pattern
  project_like TEXT,             -- optional project LIKE pattern
  priority     INT NOT NULL DEFAULT 1
);

COMMIT;
