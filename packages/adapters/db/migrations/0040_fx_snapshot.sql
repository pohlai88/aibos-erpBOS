-- M16.4: FX Snapshot for Audit Trail
-- Migration 0040: FX rate snapshots for audit compliance

CREATE TABLE IF NOT EXISTS fx_snapshot (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  plan_kind TEXT NOT NULL,           -- 'capex' | 'intangible'
  plan_id TEXT NOT NULL,
  policy TEXT NOT NULL,              -- 'post_month' | 'in_service'
  year INT,                          -- when policy=post_month
  month INT,                         -- when policy=post_month
  rate NUMERIC NOT NULL,             -- src->present_ccy
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints for valid values
ALTER TABLE fx_snapshot ADD CONSTRAINT check_fx_plan_kind 
  CHECK (plan_kind IN ('capex', 'intangible'));

ALTER TABLE fx_snapshot ADD CONSTRAINT check_fx_policy 
  CHECK (policy IN ('post_month', 'in_service'));

-- Unique constraint to prevent duplicate snapshots
CREATE UNIQUE INDEX IF NOT EXISTS fx_unique_once
ON fx_snapshot(company_id, plan_kind, plan_id, COALESCE(year,0), COALESCE(month,0), policy);

-- Performance indexes
CREATE INDEX IF NOT EXISTS fx_snapshot_company_idx ON fx_snapshot(company_id, plan_kind, plan_id);
CREATE INDEX IF NOT EXISTS fx_snapshot_policy_idx ON fx_snapshot(company_id, policy);
