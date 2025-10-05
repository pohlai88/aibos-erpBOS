-- M14.5: Driver-Based Rolling Forecast
-- Migration: 0024_driver_profiles.sql

CREATE TABLE IF NOT EXISTS driver_profile (
  id            TEXT PRIMARY KEY,    -- ULID
  company_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  formula_json  JSONB NOT NULL,     -- { "revenue": "price * volume", "cogs": "revenue * 0.6" }
  seasonality_json JSONB NOT NULL,  -- [100, 95, 110, ...] - 12 months normalized to 100%
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS driver_profile_company_name_uk
  ON driver_profile(company_id, name);

CREATE INDEX IF NOT EXISTS driver_profile_company_idx
  ON driver_profile(company_id, is_active);
