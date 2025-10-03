BEGIN;
CREATE TABLE IF NOT EXISTS ar_dunning_policy (
  company_id TEXT NOT NULL,
  policy_code TEXT NOT NULL,           -- 'DEFAULT','ENTERPRISE','SMB'
  segment     TEXT,                    -- optional customer segment
  from_bucket TEXT NOT NULL,           -- 'CURRENT','1-30','31-60','61-90','90+'
  step_idx    INT  NOT NULL,           -- 0..N sequence
  wait_days   INT  NOT NULL,           -- after entering bucket
  channel     TEXT NOT NULL CHECK (channel IN ('EMAIL','WEBHOOK')),
  template_id TEXT NOT NULL,
  throttle_days INT NOT NULL DEFAULT 3,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (company_id, policy_code, from_bucket, step_idx)
);
COMMIT;
