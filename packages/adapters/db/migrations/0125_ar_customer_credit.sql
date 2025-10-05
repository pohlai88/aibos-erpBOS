BEGIN;
CREATE TABLE IF NOT EXISTS ar_customer_credit (
  company_id  TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  policy_code TEXT NOT NULL,
  credit_limit NUMERIC NOT NULL,   -- override
  risk_score  NUMERIC,             -- external score 0..1 (higher worse)
  on_hold     BOOLEAN NOT NULL DEFAULT false,
  hold_reason TEXT,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (company_id, customer_id)
);
COMMIT;
