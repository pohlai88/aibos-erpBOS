BEGIN;
CREATE TABLE IF NOT EXISTS ar_cash_app (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  ccy TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  customer_id TEXT,
  reference TEXT,               -- payer ref / invoice ref
  confidence NUMERIC NOT NULL,  -- 0..1
  status TEXT NOT NULL CHECK (status IN ('matched','partial','unmatched','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ar_cash_app_link (
  id TEXT PRIMARY KEY,
  cash_app_id TEXT NOT NULL REFERENCES ar_cash_app(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  link_amount NUMERIC NOT NULL
);
COMMIT;
