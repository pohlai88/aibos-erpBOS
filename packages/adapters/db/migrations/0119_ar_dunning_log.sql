BEGIN;
CREATE TABLE IF NOT EXISTS ar_dunning_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_id TEXT,
  policy_code TEXT,
  bucket TEXT NOT NULL,
  step_idx INT NOT NULL,
  channel TEXT NOT NULL,
  template_id TEXT NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('sent','skipped','error')),
  error TEXT
);
CREATE INDEX IF NOT EXISTS ar_dunning_log_idx ON ar_dunning_log(company_id, customer_id, bucket, sent_at);
COMMIT;
