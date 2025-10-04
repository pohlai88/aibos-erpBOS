BEGIN;

-- Revenue Recognition POB Core (M25.1)
-- Performance Obligations (POBs) - the core revenue recognition objects

CREATE TABLE rev_pob (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES rb_subscription(id),
  invoice_line_id TEXT,                              -- references future rb_invoice_line table
  product_id TEXT NOT NULL REFERENCES rb_product(id),
  name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('POINT_IN_TIME','RATABLE_DAILY','RATABLE_MONTHLY','USAGE')),
  start_date DATE NOT NULL,
  end_date DATE,
  qty NUMERIC NOT NULL DEFAULT 1,
  uom TEXT,                                          -- unit of measure
  ssp NUMERIC,                                       -- standalone selling price
  allocated_amount NUMERIC NOT NULL,                 -- transaction price allocated to this POB
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN','FULFILLED','CANCELLED')) DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Allocation Links - tracks how invoice lines map to POBs
CREATE TABLE rev_alloc_link (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  pob_id TEXT NOT NULL REFERENCES rev_pob(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,                          -- references future rb_invoice table
  invoice_line_id TEXT NOT NULL,                     -- references future rb_invoice_line table
  line_txn_amount NUMERIC NOT NULL,                  -- original invoice line amount
  allocated_to_pob NUMERIC NOT NULL                  -- amount allocated to this POB
);

-- Indexes for performance
CREATE INDEX rev_pob_idx ON rev_pob(company_id, contract_id, status, start_date);
CREATE INDEX rev_pob_product_idx ON rev_pob(company_id, product_id, status);
CREATE INDEX rev_alloc_link_idx ON rev_alloc_link(company_id, pob_id);
CREATE INDEX rev_alloc_invoice_idx ON rev_alloc_link(company_id, invoice_id);

COMMIT;
