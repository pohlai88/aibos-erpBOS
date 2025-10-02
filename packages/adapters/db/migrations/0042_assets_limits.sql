-- M16.3: Import Guardrails and Limits
-- Migration 0042: Import and bulk posting limits

CREATE TABLE IF NOT EXISTS assets_limits (
  company_id TEXT PRIMARY KEY,
  import_max_rows INT NOT NULL DEFAULT 10000,
  bulk_post_max_rows INT NOT NULL DEFAULT 5000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints for reasonable limits
ALTER TABLE assets_limits ADD CONSTRAINT check_import_max_rows 
  CHECK (import_max_rows > 0 AND import_max_rows <= 100000);

ALTER TABLE assets_limits ADD CONSTRAINT check_bulk_post_max_rows 
  CHECK (bulk_post_max_rows > 0 AND bulk_post_max_rows <= 50000);
