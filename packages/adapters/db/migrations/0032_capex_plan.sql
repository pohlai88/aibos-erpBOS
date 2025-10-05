-- M16: Capex Plan
-- Stores capital expenditure plans with asset details and depreciation parameters

CREATE TABLE IF NOT EXISTS capex_plan (
  id            TEXT PRIMARY KEY,          -- ULID
  company_id    TEXT NOT NULL,
  asset_class   TEXT NOT NULL REFERENCES asset_class_ref(code),
  description   TEXT NOT NULL,
  capex_amount  NUMERIC NOT NULL,
  currency      TEXT NOT NULL,
  present_ccy   TEXT NOT NULL,
  in_service    DATE NOT NULL,             -- start of depreciation window
  life_m        INT,                       -- override; if null use class default
  method        TEXT,                      -- override; if null use class default
  cost_center   TEXT,
  project       TEXT,
  source_hash   TEXT NOT NULL,             -- (company_id + payload) idempotency
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    TEXT NOT NULL
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS capex_plan_company_idx ON capex_plan(company_id, in_service);
CREATE INDEX IF NOT EXISTS capex_plan_asset_class_idx ON capex_plan(asset_class);
CREATE INDEX IF NOT EXISTS capex_plan_source_hash_idx ON capex_plan(source_hash);
CREATE INDEX IF NOT EXISTS capex_plan_created_at_idx ON capex_plan(created_at);
