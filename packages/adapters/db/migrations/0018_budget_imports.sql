-- M14.3: Budget Ops & Matrix Parity - Budget Import Table
-- CSV import with dry-run support and idempotency

CREATE TABLE IF NOT EXISTS budget_import (
  id               TEXT PRIMARY KEY,              -- ULID format
  company_id       TEXT NOT NULL,
  source_name      TEXT NOT NULL,                  -- e.g. "budgets_fy2025.csv"
  source_hash      TEXT NOT NULL,                  -- sha256(file + mapping); for idempotency
  mapping_json     JSONB NOT NULL,                 -- column→field map + defaults
  delimiter        TEXT NOT NULL DEFAULT ',',
  rows_total       INTEGER NOT NULL DEFAULT 0,
  rows_valid       INTEGER NOT NULL DEFAULT 0,
  rows_invalid     INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending',-- pending|dry_run_ok|committed|failed
  error_report     JSONB,                          -- array of {row, issues[]}
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_key   TEXT NOT NULL                   -- API key id holder
);

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS budget_import_company_hash_uk
  ON budget_import (company_id, source_hash);

-- Query accelerators
CREATE INDEX IF NOT EXISTS budget_import_company_status ON budget_import(company_id, status);
CREATE INDEX IF NOT EXISTS budget_import_created_at ON budget_import(created_at);

-- Link budget lines to imports for audit trail
ALTER TABLE budget_line
  ADD COLUMN IF NOT EXISTS import_id TEXT;

CREATE INDEX IF NOT EXISTS budget_line_import_id_idx ON budget_line(import_id);

-- Add foreign key constraint
ALTER TABLE budget_line
  ADD CONSTRAINT fk_budget_line_import 
  FOREIGN KEY (import_id) REFERENCES budget_import(id) ON DELETE SET NULL;
