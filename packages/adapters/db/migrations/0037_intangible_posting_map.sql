-- M16.1: Intangible Posting Map
-- Maps intangible classes to GL accounts for amortization posting

CREATE TABLE IF NOT EXISTS intangible_posting_map (
  company_id TEXT NOT NULL,
  class TEXT NOT NULL,
  amort_expense_account TEXT NOT NULL,      -- e.g., "7450"
  accum_amort_account   TEXT NOT NULL,      -- e.g., "1609"
  PRIMARY KEY (company_id, class)
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS intangible_posting_map_company_idx ON intangible_posting_map(company_id);
CREATE INDEX IF NOT EXISTS intangible_posting_map_class_idx ON intangible_posting_map(class);
CREATE INDEX IF NOT EXISTS intangible_posting_map_expense_account_idx ON intangible_posting_map(amort_expense_account);
CREATE INDEX IF NOT EXISTS intangible_posting_map_accum_account_idx ON intangible_posting_map(accum_amort_account);
