-- M16.3: Asset Impairments
-- Migration 0039: Asset impairment tracking

CREATE TABLE IF NOT EXISTS asset_impairment (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  plan_kind TEXT NOT NULL,           -- 'capex' | 'intangible'
  plan_id TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,           -- write-down amount in present_ccy
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Add constraints for valid plan kinds
ALTER TABLE asset_impairment ADD CONSTRAINT check_plan_kind 
  CHECK (plan_kind IN ('capex', 'intangible'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS asset_impairment_company_idx ON asset_impairment(company_id, date);
CREATE INDEX IF NOT EXISTS asset_impairment_plan_idx ON asset_impairment(company_id, plan_kind, plan_id);
