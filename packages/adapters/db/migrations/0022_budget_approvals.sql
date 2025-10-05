-- M14.4: Budget Versions, Approvals, & Variance Alerts - Budget Approvals
-- Approval workflow audit trail

CREATE TABLE IF NOT EXISTS budget_approval (
  id            TEXT PRIMARY KEY,     -- ULID
  company_id    TEXT NOT NULL,
  version_id    TEXT NOT NULL,
  action        TEXT NOT NULL,        -- submit|approve|return
  actor         TEXT NOT NULL,        -- user id / api key id
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS budget_approval_version_idx ON budget_approval(version_id);
CREATE INDEX IF NOT EXISTS budget_approval_company_idx ON budget_approval(company_id);
CREATE INDEX IF NOT EXISTS budget_approval_action_idx ON budget_approval(action);
CREATE INDEX IF NOT EXISTS budget_approval_created_idx ON budget_approval(created_at);

-- Add foreign key constraint
ALTER TABLE budget_approval
  ADD CONSTRAINT fk_budget_approval_version 
  FOREIGN KEY (version_id) REFERENCES budget_version(id) ON DELETE CASCADE;
