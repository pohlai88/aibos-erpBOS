BEGIN;

-- Revenue & Billing Usage Tables
CREATE TABLE rb_usage_event (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL REFERENCES rb_subscription(id) ON DELETE CASCADE,
  event_time timestamptz NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  uniq_hash TEXT NOT NULL,                         -- idempotency / dedupe
  payload JSONB
);
CREATE UNIQUE INDEX rb_usage_uk ON rb_usage_event(company_id, subscription_id, uniq_hash);

CREATE TABLE rb_usage_rollup (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  window_start timestamptz NOT NULL,
  window_end   timestamptz NOT NULL,
  unit TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  meta JSONB
);
CREATE INDEX rb_usage_rollup_idx ON rb_usage_rollup(company_id, subscription_id, window_end);

COMMIT;
