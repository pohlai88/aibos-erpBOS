-- M14.4: Budget Versions, Approvals, & Variance Alerts - Budget Alert Rules
-- Variance alert rules with configurable thresholds and delivery methods

CREATE TABLE IF NOT EXISTS budget_alert_rule (
  id             TEXT PRIMARY KEY,    -- ULID
  company_id     TEXT NOT NULL,
  name           TEXT NOT NULL,
  account_code   TEXT,                -- null = all accounts
  cost_center    TEXT,                -- null = all cost centers
  project        TEXT,                -- null = all projects
  period_scope   TEXT NOT NULL,       -- month|qtr|ytd
  threshold_pct  NUMERIC NOT NULL,    -- e.g. 10 = 10%
  comparator     TEXT NOT NULL,       -- gt|lt|gte|lte|abs_gt|abs_gte
  delivery       JSONB NOT NULL,      -- { "email":["..."], "webhook":"https://..." }
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     TEXT NOT NULL
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS budget_alert_rule_company_idx ON budget_alert_rule(company_id);
CREATE INDEX IF NOT EXISTS budget_alert_rule_active_idx ON budget_alert_rule(company_id, is_active);
CREATE INDEX IF NOT EXISTS budget_alert_rule_account_idx ON budget_alert_rule(company_id, account_code);
CREATE INDEX IF NOT EXISTS budget_alert_rule_scope_idx ON budget_alert_rule(period_scope);

-- Add check constraints for data integrity
ALTER TABLE budget_alert_rule
  ADD CONSTRAINT chk_budget_alert_period_scope 
  CHECK (period_scope IN ('month', 'qtr', 'ytd'));

ALTER TABLE budget_alert_rule
  ADD CONSTRAINT chk_budget_alert_comparator 
  CHECK (comparator IN ('gt', 'lt', 'gte', 'lte', 'abs_gt', 'abs_gte'));

ALTER TABLE budget_alert_rule
  ADD CONSTRAINT chk_budget_alert_threshold 
  CHECK (threshold_pct > 0 AND threshold_pct <= 1000); -- reasonable range: 0.1% to 1000%
