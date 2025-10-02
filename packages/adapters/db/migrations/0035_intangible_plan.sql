-- M16.1: Intangible Plan
-- Stores intangible asset plans with amortization parameters

CREATE TABLE IF NOT EXISTS intangible_plan (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  class TEXT NOT NULL,                      -- e.g., "SOFTWARE", "PATENT"
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  present_ccy TEXT NOT NULL,
  in_service DATE NOT NULL,
  life_m INT NOT NULL,                      -- months
  cost_center TEXT,
  project TEXT,
  source_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS intangible_plan_company_idx ON intangible_plan(company_id, in_service);
CREATE INDEX IF NOT EXISTS intangible_plan_class_idx ON intangible_plan(class);
CREATE INDEX IF NOT EXISTS intangible_plan_source_hash_idx ON intangible_plan(source_hash);
CREATE INDEX IF NOT EXISTS intangible_plan_created_at_idx ON intangible_plan(created_at);
