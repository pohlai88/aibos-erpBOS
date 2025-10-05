BEGIN;
CREATE TABLE IF NOT EXISTS ar_credit_hold_log (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  event       TEXT NOT NULL CHECK (event IN ('HOLD','RELEASE')),
  reason      TEXT,
  snapshot    JSONB,                 -- exposure, dso, risk when event triggered
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);
COMMIT;
