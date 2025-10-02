BEGIN;

CREATE TABLE IF NOT EXISTS fx_account_map (
  company_id TEXT NOT NULL,
  -- classification of monetary GL accounts (pattern or explicit)
  gl_account TEXT NOT NULL,                 -- e.g. '1100' Cash-USD, '1200' AR-USD
  unreal_gain_account TEXT NOT NULL,        -- e.g. 7190
  unreal_loss_account TEXT NOT NULL,        -- e.g. 8190
  PRIMARY KEY (company_id, gl_account)
);

COMMIT;
