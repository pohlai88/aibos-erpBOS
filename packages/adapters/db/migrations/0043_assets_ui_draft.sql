-- M16.3: UI Drafts Cache
-- Migration 0043: Preview cache for UI dry-run operations

CREATE TABLE IF NOT EXISTS assets_ui_draft (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  kind TEXT NOT NULL,          -- 'depr'|'amort'
  year INT NOT NULL,
  month INT NOT NULL,
  payload JSONB NOT NULL,      -- dry-run summary blob
  expires_at TIMESTAMPTZ NOT NULL
);

-- Add constraints for valid kinds
ALTER TABLE assets_ui_draft ADD CONSTRAINT check_draft_kind 
  CHECK (kind IN ('depr', 'amort'));

-- Add constraints for valid year/month
ALTER TABLE assets_ui_draft ADD CONSTRAINT check_draft_year 
  CHECK (year >= 1900 AND year <= 2100);

ALTER TABLE assets_ui_draft ADD CONSTRAINT check_draft_month 
  CHECK (month >= 1 AND month <= 12);

-- Performance indexes
CREATE INDEX IF NOT EXISTS assets_ui_draft_exp ON assets_ui_draft(expires_at);
CREATE INDEX IF NOT EXISTS assets_ui_draft_company_idx ON assets_ui_draft(company_id, kind, year, month);

-- Unique constraint to prevent duplicate drafts
CREATE UNIQUE INDEX IF NOT EXISTS assets_ui_draft_unique 
ON assets_ui_draft(company_id, kind, year, month);
