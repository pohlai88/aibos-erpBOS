BEGIN;

CREATE TABLE IF NOT EXISTS ap_approval_policy (
  company_id     TEXT NOT NULL,
  policy_code    TEXT NOT NULL,              -- 'DEFAULT', 'HIGH_RISK'
  min_amount     NUMERIC NOT NULL DEFAULT 0, -- inclusive
  max_amount     NUMERIC,                    -- null = no cap
  currency       TEXT,                       -- null = any
  require_reviewer BOOLEAN NOT NULL DEFAULT true,
  require_approver BOOLEAN NOT NULL DEFAULT true,
  require_dual_approver BOOLEAN NOT NULL DEFAULT false, -- 4-eyes or 6-eyes
  updated_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     TEXT NOT NULL,
  PRIMARY KEY (company_id, policy_code)
);

-- Optional link: supplier → policy
CREATE TABLE IF NOT EXISTS ap_supplier_policy (
  company_id   TEXT NOT NULL,
  supplier_id  TEXT NOT NULL,
  policy_code  TEXT NOT NULL,
  PRIMARY KEY (company_id, supplier_id)
);

-- Run approvals trail
CREATE TABLE IF NOT EXISTS ap_run_approval (
  id           TEXT PRIMARY KEY,
  run_id       TEXT NOT NULL REFERENCES ap_pay_run(id) ON DELETE CASCADE,
  step         TEXT NOT NULL CHECK (step IN ('review','approve','approve2','execute')),
  actor        TEXT NOT NULL,
  decided_at   timestamptz NOT NULL DEFAULT now(),
  decision     TEXT NOT NULL CHECK (decision IN ('approve','reject')),
  reason       TEXT
);

COMMIT;
