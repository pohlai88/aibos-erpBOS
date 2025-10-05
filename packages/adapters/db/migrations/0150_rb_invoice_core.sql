BEGIN;

-- Revenue & Billing Invoice Core Tables
CREATE TABLE rb_invoice (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  present_ccy TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','FINAL','VOID','PAID','PARTIAL')) DEFAULT 'DRAFT',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_total NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  fx_present_rate NUMERIC,                         -- snapshot for present ccy
  meta JSONB,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);
CREATE INDEX rb_inv_idx ON rb_invoice(company_id, customer_id, status, issue_date);

CREATE TABLE rb_invoice_line (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES rb_invoice(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ONE_TIME','RECURRING','USAGE','CREDIT','ADJUSTMENT','ROUNDING')),
  product_id TEXT,
  description TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC NOT NULL,
  line_subtotal NUMERIC NOT NULL,
  tax_code TEXT,                                   -- join to your tax engine
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL
);
CREATE INDEX rb_inv_line_idx ON rb_invoice_line(company_id, invoice_id, kind);

COMMIT;
