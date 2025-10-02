-- M15: Cash Forecast Version Migration
-- Migration: 0029_cash_versions.sql

CREATE TABLE IF NOT EXISTS cash_forecast_version (
  id          TEXT PRIMARY KEY,              -- ULID
  company_id  TEXT NOT NULL,
  code        TEXT NOT NULL,                 -- e.g., CFY25-01
  label       TEXT NOT NULL,
  year        INT  NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|approved|returned|archived
  profile_id  TEXT,                          -- fk to wc_profile.id (soft)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS cash_version_company_code_uk 
  ON cash_forecast_version (company_id, code);
