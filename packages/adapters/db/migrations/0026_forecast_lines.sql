-- M14.5: Driver-Based Rolling Forecast
-- Migration: 0026_forecast_lines.sql

CREATE TABLE IF NOT EXISTS forecast_line (
  id               TEXT PRIMARY KEY,    -- ULID
  company_id       TEXT NOT NULL,
  version_id       TEXT NOT NULL,        -- FK to forecast_version.id
  account_code     TEXT NOT NULL,
  cost_center_code TEXT,
  project_code     TEXT,
  month            INT  NOT NULL,        -- 1-12
  amount           NUMERIC NOT NULL,
  currency         CHAR(3) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forecast_line_version_idx
  ON forecast_line(version_id, company_id);

CREATE INDEX IF NOT EXISTS forecast_line_company_month_idx
  ON forecast_line(company_id, month);

CREATE INDEX IF NOT EXISTS forecast_line_account_idx
  ON forecast_line(account_code, month);
