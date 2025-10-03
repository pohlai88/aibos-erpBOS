BEGIN;

-- Revenue & Billing Invoice Email Table
CREATE TABLE rb_invoice_email (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES rb_invoice(id) ON DELETE CASCADE,
  to_addr TEXT NOT NULL,
  sent_at timestamptz,
  status TEXT NOT NULL CHECK (status IN ('queued','sent','error')) DEFAULT 'queued',
  error TEXT
);

COMMIT;
