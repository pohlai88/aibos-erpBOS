-- M14.5 Promotion: Sample Driver Profile Seed Data
-- Migration: 0027_sample_driver_profile.sql

-- Sample Revenue Growth Driver Profile
INSERT INTO driver_profile (
  id,
  company_id,
  name,
  description,
  formula_json,
  seasonality_json,
  created_by
) VALUES (
  'dp_sample_revenue_growth',
  'COMP-1', -- Replace with actual company ID
  'Revenue Growth Model',
  'Standard revenue driver model: Revenue = Price × Volume, COGS = 60% of Revenue',
  '{"4000": "revenue * 0.6", "5000": "revenue * 0.3", "6000": "revenue * 0.1"}',
  '{"1": 100, "2": 95, "3": 110, "4": 105, "5": 100, "6": 95, "7": 90, "8": 105, "9": 110, "10": 100, "11": 95, "12": 120}',
  'system_seed'
) ON CONFLICT (id) DO NOTHING;

-- Sample Forecast Version
INSERT INTO forecast_version (
  id,
  company_id,
  code,
  label,
  year,
  driver_profile_id,
  created_by,
  updated_by
) VALUES (
  'fv_sample_fy26_fc1',
  'COMP-1', -- Replace with actual company ID
  'FY26-FC1',
  'FY26 Q1 Forecast - Sample',
  2026,
  'dp_sample_revenue_growth',
  'system_seed',
  'system_seed'
) ON CONFLICT (id) DO NOTHING;
