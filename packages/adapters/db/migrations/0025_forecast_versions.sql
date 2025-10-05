-- M14.5: Driver-Based Rolling Forecast
-- Migration: 0025_forecast_versions.sql

CREATE TABLE IF NOT EXISTS forecast_version (
  id                TEXT PRIMARY KEY,    -- ULID
  company_id        TEXT NOT NULL,
  code              TEXT NOT NULL,        -- e.g. "FY25-FC1", "FY25-Q2-FC"
  label             TEXT NOT NULL,
  year              INT  NOT NULL,
  driver_profile_id TEXT,                -- FK to driver_profile.id
  status            TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|approved|returned|archived
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by        TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS forecast_version_company_code_uk
  ON forecast_version(company_id, code);

CREATE INDEX IF NOT EXISTS forecast_version_company_year_idx
  ON forecast_version(company_id, year, status);
