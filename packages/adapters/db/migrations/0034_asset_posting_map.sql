-- M16: Asset Posting Map
-- Maps asset classes to GL accounts for depreciation posting

CREATE TABLE IF NOT EXISTS asset_posting_map (
  company_id TEXT NOT NULL,
  asset_class TEXT NOT NULL REFERENCES asset_class_ref(code),
  depr_expense_account TEXT NOT NULL,      -- e.g., "7000"
  accum_depr_account   TEXT NOT NULL,      -- e.g., "1509"
  PRIMARY KEY (company_id, asset_class)
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS asset_posting_map_company_idx ON asset_posting_map(company_id);
CREATE INDEX IF NOT EXISTS asset_posting_map_asset_class_idx ON asset_posting_map(asset_class);
CREATE INDEX IF NOT EXISTS asset_posting_map_expense_account_idx ON asset_posting_map(depr_expense_account);
CREATE INDEX IF NOT EXISTS asset_posting_map_accum_account_idx ON asset_posting_map(accum_depr_account);
