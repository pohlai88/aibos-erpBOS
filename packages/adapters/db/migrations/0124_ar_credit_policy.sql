BEGIN;
CREATE TABLE IF NOT EXISTS ar_credit_policy (
  company_id   TEXT NOT NULL,
  policy_code  TEXT NOT NULL,          -- 'DEFAULT','ENTERPRISE'
  segment      TEXT,                   -- match customer segment
  max_limit    NUMERIC NOT NULL,       -- credit limit in base/present ccy
  dso_target   INT NOT NULL DEFAULT 45,
  grace_days   INT NOT NULL DEFAULT 5, -- days beyond due before hold
  ptp_tolerance INT NOT NULL DEFAULT 2,
  risk_weight  NUMERIC NOT NULL DEFAULT 1.0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, policy_code)
);
COMMIT;
