BEGIN;

-- Revenue & Billing Catalog Tables
CREATE TABLE rb_product (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  sku TEXT NOT NULL,                              -- unique per company
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ONE_TIME','RECURRING','USAGE')),
  gl_rev_acct TEXT,                               -- optional, else policy
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')) DEFAULT 'ACTIVE',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);
CREATE UNIQUE INDEX rb_product_uk ON rb_product(company_id, sku);

CREATE TABLE rb_price_book (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,                             -- 'DEFAULT','ENTERPRISE'
  currency TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);
CREATE UNIQUE INDEX rb_price_book_uk ON rb_price_book(company_id, code, currency);

CREATE TABLE rb_price (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES rb_product(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES rb_price_book(id) ON DELETE CASCADE,
  model TEXT NOT NULL CHECK (model IN ('FLAT','TIERED','STAIR','VOLUME')),
  unit_amount NUMERIC,                             -- FLAT baseline
  unit TEXT,                                       -- 'seat','GB','txn'
  interval TEXT CHECK (interval IN ('DAY','WEEK','MONTH','YEAR')),
  interval_count INT DEFAULT 1,
  min_qty NUMERIC DEFAULT 0,
  max_qty NUMERIC,
  meta JSONB,
  UNIQUE (company_id, product_id, book_id)
);

COMMIT;
