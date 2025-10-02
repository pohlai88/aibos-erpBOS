-- M16.3/M16.4: Assets Configuration + FX Policy
-- Migration 0038: Assets config and FX presentation policy

CREATE TABLE IF NOT EXISTS assets_config (
  company_id TEXT PRIMARY KEY,
  proration_enabled BOOLEAN NOT NULL DEFAULT false,
  proration_basis TEXT NOT NULL DEFAULT 'days_in_month', -- 'days_in_month' | 'half_month'
  fx_presentation_policy TEXT NOT NULL DEFAULT 'post_month', -- 'post_month' | 'in_service'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints for valid values
ALTER TABLE assets_config ADD CONSTRAINT check_proration_basis 
  CHECK (proration_basis IN ('days_in_month', 'half_month'));

ALTER TABLE assets_config ADD CONSTRAINT check_fx_policy 
  CHECK (fx_presentation_policy IN ('post_month', 'in_service'));
