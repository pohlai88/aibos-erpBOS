BEGIN;

-- Revenue Recognition Policy Mapping (M25.1)
-- Company-level and product-level recognition policies

CREATE TABLE rev_policy (
  company_id TEXT PRIMARY KEY,
  rev_account TEXT NOT NULL,                        -- default revenue account
  unbilled_ar_account TEXT NOT NULL,                -- unbilled AR account
  deferred_rev_account TEXT NOT NULL,                -- deferred revenue account
  rounding TEXT NOT NULL DEFAULT 'HALF_UP' CHECK (rounding IN ('HALF_UP','BANKERS')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);

-- Product-level recognition method overrides
CREATE TABLE rev_prod_policy (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES rb_product(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('POINT_IN_TIME','RATABLE_DAILY','RATABLE_MONTHLY','USAGE')),
  rev_account TEXT,                                 -- product-specific revenue account
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  UNIQUE(company_id, product_id)
);

-- Indexes for performance
CREATE INDEX rev_prod_policy_idx ON rev_prod_policy(company_id, product_id);

COMMIT;
