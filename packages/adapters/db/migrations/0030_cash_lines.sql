-- M15: Cash Lines Migration
-- Migration: 0030_cash_lines.sql

CREATE TABLE IF NOT EXISTS cash_line (
  id             TEXT PRIMARY KEY,           -- ULID
  company_id     TEXT NOT NULL,
  version_id     TEXT NOT NULL,              -- cash_forecast_version.id
  year           INT  NOT NULL,
  month          INT  NOT NULL,              -- 1..12
  currency       TEXT NOT NULL,              -- source currency
  present_ccy    TEXT NOT NULL,              -- presentation currency (post-conversion)
  cash_in        NUMERIC NOT NULL DEFAULT 0,
  cash_out       NUMERIC NOT NULL DEFAULT 0,
  net_change     NUMERIC NOT NULL DEFAULT 0,
  cost_center    TEXT,                       -- denormalized code (optional)
  project        TEXT,                       -- denormalized code (optional)
  source_hash    TEXT NOT NULL,              -- idempotency for generation
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
