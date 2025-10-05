BEGIN;

-- Pattern rules to auto-detect IC nature & which accounts to eliminate against
CREATE TABLE IF NOT EXISTS ic_elim_map (
  company_id TEXT NOT NULL,
  rule_code  TEXT NOT NULL,
  src_account_like TEXT,      -- e.g. '4%' for Sales
  cp_account_like  TEXT,      -- e.g. '5%' for COGS on CP
  note       TEXT,
  active     BOOLEAN NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, rule_code)
);

COMMIT;
