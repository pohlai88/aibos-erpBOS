BEGIN;

-- Revenue & Billing Credit Memo Tables
CREATE TABLE rb_credit_memo (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','FINAL','APPLIED','VOID')) DEFAULT 'DRAFT',
  present_ccy TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

CREATE TABLE rb_credit_apply (
  id TEXT PRIMARY KEY,
  memo_id TEXT NOT NULL REFERENCES rb_credit_memo(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES rb_invoice(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL
);

COMMIT;
