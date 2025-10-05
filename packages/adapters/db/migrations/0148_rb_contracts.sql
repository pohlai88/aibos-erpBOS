BEGIN;

-- Revenue & Billing Contracts Tables
CREATE TABLE rb_contract (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  book_id TEXT NOT NULL REFERENCES rb_price_book(id),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','CANCELLED')) DEFAULT 'ACTIVE',
  terms JSONB,                                    -- custom caps, discounts, fx, etc.
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);

CREATE TABLE rb_subscription (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL REFERENCES rb_contract(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES rb_product(id),
  price_id TEXT NOT NULL REFERENCES rb_price(id),
  qty NUMERIC NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  bill_anchor DATE NOT NULL,                       -- anchor day for cycle
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','PAUSED','CANCELLED')) DEFAULT 'ACTIVE',
  proration TEXT NOT NULL CHECK (proration IN ('DAILY','NONE')) DEFAULT 'DAILY',
  meta JSONB
);
CREATE INDEX rb_subs_idx ON rb_subscription(company_id, status, bill_anchor);

COMMIT;
