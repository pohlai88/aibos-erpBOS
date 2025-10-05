-- M15: Cash Lines Indexes Migration
-- Migration: 0031_cash_indexes.sql

CREATE INDEX IF NOT EXISTS cash_line_company_period_idx
  ON cash_line (company_id, year, month);

CREATE INDEX IF NOT EXISTS cash_line_version_idx
  ON cash_line (company_id, version_id);

CREATE INDEX IF NOT EXISTS cash_line_cc_proj_idx
  ON cash_line (company_id, cost_center, project);
