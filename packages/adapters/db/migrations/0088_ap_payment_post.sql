BEGIN;

CREATE TABLE IF NOT EXISTS ap_payment_post (
  id         TEXT PRIMARY KEY,
  run_id     TEXT NOT NULL REFERENCES ap_pay_run(id) ON DELETE CASCADE,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  fee_account TEXT,                    -- GL account for bank fees
  realized_fx NUMERIC NOT NULL DEFAULT 0,
  realized_fx_account TEXT,            -- GL account for realized FX
  posted_at  timestamptz,
  journal_id TEXT                      -- link to posted JE
);
COMMIT;
