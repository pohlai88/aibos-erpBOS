BEGIN;
CREATE TABLE IF NOT EXISTS cf_receipt_signal (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  ccy TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('AUTO_MATCH','PTP','MANUAL')),
  ref_id TEXT,                        -- cash_app id / ptp id
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cf_receipt_signal_idx ON cf_receipt_signal(company_id, week_start, source);
COMMIT;
