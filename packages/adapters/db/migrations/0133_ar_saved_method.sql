BEGIN;

CREATE TABLE IF NOT EXISTS ar_saved_method (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  customer_id  TEXT NOT NULL,
  gateway      TEXT NOT NULL,
  token_ref    TEXT NOT NULL,            -- network token / pm id (no PAN)
  brand        TEXT,                     -- 'visa','mastercard','ach'
  last4        TEXT,
  exp_month    INT,
  exp_year     INT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ar_saved_meth_idx ON ar_saved_method(company_id, customer_id, is_default DESC);

COMMIT;
