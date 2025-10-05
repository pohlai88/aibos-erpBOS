-- M15: Working Capital Profile Migration
-- Migration: 0028_wc_profile.sql

CREATE TABLE IF NOT EXISTS wc_profile (
  id            TEXT PRIMARY KEY,            -- ULID
  company_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  dso_days      NUMERIC NOT NULL,            -- Days Sales Outstanding
  dpo_days      NUMERIC NOT NULL,            -- Days Payables Outstanding
  dio_days      NUMERIC NOT NULL,            -- Days Inventory Outstanding
  tax_rate_pct  NUMERIC NOT NULL DEFAULT 24, -- e.g., 24 = 24%
  interest_apr  NUMERIC NOT NULL DEFAULT 6,  -- annual %
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS wc_profile_company_name_uk 
  ON wc_profile (company_id, name);
