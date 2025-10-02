BEGIN;

-- Receipts/Payments drivers per week (ISO week) and dimension
CREATE TABLE IF NOT EXISTS cf_driver_week (
  company_id  TEXT NOT NULL,
  year        INT NOT NULL,
  iso_week    INT NOT NULL CHECK (iso_week BETWEEN 1 AND 53),
  driver_code TEXT NOT NULL,           -- 'AR_COLLECTION', 'AP_PAYMENT', 'PAYROLL', 'TAX'
  cost_center TEXT, project TEXT,
  amount      NUMERIC NOT NULL,
  scenario    TEXT NOT NULL,           -- cf_scenario.code
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (company_id, year, iso_week, driver_code, COALESCE(cost_center,''), COALESCE(project,''), scenario)
);

-- Manual adjustments (weekly)
CREATE TABLE IF NOT EXISTS cf_adjust_week (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  year        INT NOT NULL,
  iso_week    INT NOT NULL,
  bucket      TEXT NOT NULL CHECK (bucket IN ('RECEIPTS','PAYMENTS')),
  memo        TEXT,
  amount      NUMERIC NOT NULL,
  scenario    TEXT NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);

COMMIT;
