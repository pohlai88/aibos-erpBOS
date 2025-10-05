BEGIN;
CREATE TABLE IF NOT EXISTS ar_ptp (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  promised_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','kept','broken','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  decided_at timestamptz,
  decided_by TEXT
);

CREATE TABLE IF NOT EXISTS ar_dispute (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,        -- 'PRICING','SERVICE','GOODS','ADMIN'
  detail TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','resolved','written_off')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  resolved_at timestamptz,
  resolved_by TEXT
);
COMMIT;
