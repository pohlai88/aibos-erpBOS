BEGIN;

-- Create AR invoice master table (required for M24.1 credit management)
CREATE TABLE IF NOT EXISTS ar_invoice (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  customer_id  TEXT NOT NULL,
  invoice_no   TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date     DATE NOT NULL,
  amount       NUMERIC NOT NULL,
  ccy          TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('open','paid','cancelled','void')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ar_inv_company_status_idx ON ar_invoice(company_id, status);
CREATE INDEX IF NOT EXISTS ar_inv_customer_idx ON ar_invoice(company_id, customer_id);
CREATE INDEX IF NOT EXISTS ar_inv_due_date_idx ON ar_invoice(company_id, due_date) WHERE status = 'open';

COMMIT;
