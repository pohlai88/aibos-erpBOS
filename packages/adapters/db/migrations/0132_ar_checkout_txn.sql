BEGIN;

CREATE TABLE IF NOT EXISTS ar_checkout_txn (
  id           TEXT PRIMARY KEY,
  intent_id    TEXT NOT NULL REFERENCES ar_checkout_intent(id) ON DELETE CASCADE,
  gateway      TEXT NOT NULL,
  ext_ref      TEXT,                       -- gateway payment id
  status       TEXT NOT NULL CHECK (status IN ('authorized','captured','failed','refunded','voided')),
  amount       NUMERIC NOT NULL,
  fee_amount   NUMERIC,                    -- gateway fee if provided
  ccy          TEXT NOT NULL,
  payload      JSONB,                      -- webhook echo
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ar_txn_intent_idx ON ar_checkout_txn(intent_id, status);

COMMIT;
