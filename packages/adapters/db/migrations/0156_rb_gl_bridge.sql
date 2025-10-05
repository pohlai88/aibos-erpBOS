BEGIN;

-- Revenue & Billing GL Bridge
CREATE TABLE rb_post_lock (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX rb_post_lock_uk ON rb_post_lock(company_id, invoice_id);

COMMIT;
