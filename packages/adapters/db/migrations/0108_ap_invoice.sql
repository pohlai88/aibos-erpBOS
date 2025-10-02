BEGIN;

-- Create AP invoice master table (referenced by payment run logic but was missing)
CREATE TABLE IF NOT EXISTS ap_invoice (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  supplier_id  TEXT NOT NULL,
  invoice_no   TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date     DATE NOT NULL,
  gross_amount NUMERIC NOT NULL,
  disc_amount  NUMERIC NOT NULL DEFAULT 0,
  ccy          TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('OPEN','PAID','CANCELLED','VOID')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL,
  -- M23.3: Early payment discount terms
  discount_pct      NUMERIC,         -- e.g., 0.02 for 2%
  discount_days     INT,             -- e.g., 10 days
  net_days          INT,             -- e.g., 30 days  
  discount_due_date DATE,            -- computed cache for scan performance
  terms_text        TEXT             -- parsed source (e.g., "2/10, net 30")
);

CREATE INDEX IF NOT EXISTS ap_inv_company_status_idx ON ap_invoice(company_id, status);
CREATE INDEX IF NOT EXISTS ap_inv_supplier_idx ON ap_invoice(company_id, supplier_id);
CREATE INDEX IF NOT EXISTS ap_inv_due_date_idx ON ap_invoice(company_id, due_date) WHERE status = 'OPEN';
-- M23.3: Discount-specific index for candidate scanning
CREATE INDEX IF NOT EXISTS ap_inv_discount_due_idx ON ap_invoice(company_id, discount_due_date) WHERE discount_due_date IS NOT NULL AND status = 'OPEN';
CREATE INDEX IF NOT EXISTS ap_inv_terms_idx ON ap_invoice(company_id, discount_pct, discount_due_date) WHERE discount_pct IS NOT NULL AND status = 'OPEN';

COMMIT;

