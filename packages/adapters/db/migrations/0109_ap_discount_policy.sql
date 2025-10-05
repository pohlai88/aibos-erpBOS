BEGIN;

CREATE TABLE IF NOT EXISTS ap_discount_policy (
  company_id      TEXT PRIMARY KEY,
  hurdle_apy      NUMERIC NOT NULL,    -- annual % hurdle, e.g. 0.20 = 20%
  min_savings_amt NUMERIC NOT NULL DEFAULT 0,   -- absolute floor per invoice
  min_savings_pct NUMERIC NOT NULL DEFAULT 0,   -- % of invoice floor
  liquidity_buffer NUMERIC NOT NULL DEFAULT 0,  -- required cash buffer in present ccy
  posting_mode    TEXT NOT NULL CHECK (posting_mode IN ('REDUCE_EXPENSE','OTHER_INCOME')),
  posting_account TEXT,                 -- when OTHER_INCOME, or override
  max_tenor_days  INT NOT NULL DEFAULT 30,      -- latest acceptable acceleration window
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      TEXT NOT NULL
);

COMMIT;

