-- M14.4: Budget Versions, Approvals, & Variance Alerts - Budget Versions
-- Versioned budgets with approval workflow support

CREATE TABLE IF NOT EXISTS budget_version (
  id            TEXT PRIMARY KEY,        -- ULID
  company_id    TEXT NOT NULL,
  code          TEXT NOT NULL,           -- e.g. "FY25-BL", "FY25-WIP", "FY25-V2"
  label         TEXT NOT NULL,
  year          INT  NOT NULL,
  is_baseline   BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'draft',  -- draft|submitted|approved|returned|archived
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    TEXT NOT NULL
);

-- Unique constraint for version codes per company
CREATE UNIQUE INDEX IF NOT EXISTS budget_version_company_code_uk
  ON budget_version(company_id, code);

-- Query accelerators
CREATE INDEX IF NOT EXISTS budget_version_company_year_idx ON budget_version(company_id, year);
CREATE INDEX IF NOT EXISTS budget_version_status_idx ON budget_version(company_id, status);
CREATE INDEX IF NOT EXISTS budget_version_baseline_idx ON budget_version(company_id, is_baseline);

-- Link budget lines to versions
ALTER TABLE budget_line
  ADD COLUMN IF NOT EXISTS version_id TEXT;      -- FK to budget_version.id (soft FK if you prefer)

CREATE INDEX IF NOT EXISTS budget_line_version_idx ON budget_line(version_id, company_id);

-- Add foreign key constraint (optional - can be soft FK for flexibility)
-- ALTER TABLE budget_line
--   ADD CONSTRAINT fk_budget_line_version 
--   FOREIGN KEY (version_id) REFERENCES budget_version(id) ON DELETE SET NULL;
