-- M14.3: Budget Performance Indexes
-- Fast lookup for idempotency and typical report filters

-- Fast lookup for idempotency
CREATE INDEX IF NOT EXISTS budget_import_company_hash_idx
  ON budget_import (company_id, source_hash);

-- Typical filters for reports
CREATE INDEX IF NOT EXISTS budget_line_company_period_idx
  ON budget_line (company_id, period_month);

-- Dimension lookups for pivot reports
CREATE INDEX IF NOT EXISTS budget_line_cc_idx ON budget_line (cost_center_id);
CREATE INDEX IF NOT EXISTS budget_line_project_idx ON budget_line (project_id);
CREATE INDEX IF NOT EXISTS budget_line_account_idx ON budget_line (account_code);

-- Import audit trail
CREATE INDEX IF NOT EXISTS budget_line_import_status_idx ON budget_import (company_id, status);
CREATE INDEX IF NOT EXISTS budget_line_import_created_idx ON budget_import (created_at);
