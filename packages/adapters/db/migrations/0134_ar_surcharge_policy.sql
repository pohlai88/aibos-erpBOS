BEGIN;

CREATE TABLE IF NOT EXISTS ar_surcharge_policy (
  company_id   TEXT PRIMARY KEY,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  pct          NUMERIC NOT NULL DEFAULT 0,     -- e.g., 0.015 = 1.5%
  min_fee      NUMERIC NOT NULL DEFAULT 0,
  cap_fee      NUMERIC,                        -- optional cap
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL
);

COMMIT;
