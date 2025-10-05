BEGIN;

-- Revenue Contract Modifications (M25.2)
-- Change Order Header Table
CREATE TABLE rev_change_order (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SEPARATE','TERMINATION_NEW','PROSPECTIVE','RETROSPECTIVE')),
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','APPLIED','VOID')) DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Change Order Line Items
CREATE TABLE rev_change_line (
  id TEXT PRIMARY KEY,
  change_order_id TEXT NOT NULL REFERENCES rev_change_order(id) ON DELETE CASCADE,
  pob_id TEXT,                                    -- existing POB (modify) or NULL to add new
  product_id TEXT REFERENCES rb_product(id),      -- for new POB
  qty_delta NUMERIC,                              -- quantity change
  price_delta NUMERIC,                            -- price change
  term_delta_days INTEGER,                        -- term change in days
  new_method TEXT CHECK (new_method IN ('POINT_IN_TIME','RATABLE_DAILY','RATABLE_MONTHLY','USAGE')),
  new_ssp NUMERIC                                 -- new standalone selling price
);

-- Indexes for performance
CREATE INDEX rev_co_idx ON rev_change_order(company_id, contract_id, effective_date, status);
CREATE INDEX rev_cl_idx ON rev_change_line(change_order_id, pob_id);

COMMIT;
