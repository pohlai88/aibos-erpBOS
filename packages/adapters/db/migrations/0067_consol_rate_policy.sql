BEGIN;

-- Policy per account class (default) with optional account override
CREATE TABLE IF NOT EXISTS consol_rate_policy (
  company_id TEXT NOT NULL,
  class      TEXT NOT NULL CHECK (class IN ('ASSET','LIAB','EQUITY','REVENUE','EXPENSE')),
  method     TEXT NOT NULL CHECK (method IN ('CLOSING','AVERAGE','HISTORICAL')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, class)
);

CREATE TABLE IF NOT EXISTS consol_rate_override (
  company_id TEXT NOT NULL,
  account    TEXT NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('CLOSING','AVERAGE','HISTORICAL')),
  note       TEXT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, account)
);

COMMIT;
