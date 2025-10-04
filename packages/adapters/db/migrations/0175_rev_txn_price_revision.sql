BEGIN;

-- Transaction Price Revision (M25.2)
-- Tracks transaction price changes from contract modifications
CREATE TABLE rev_txn_price_rev (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  change_order_id TEXT NOT NULL REFERENCES rev_change_order(id) ON DELETE CASCADE,
  previous_total_tp NUMERIC NOT NULL,            -- total transaction price before
  new_total_tp NUMERIC NOT NULL,                 -- total transaction price after
  allocated_deltas JSONB NOT NULL,               -- per-POB allocation deltas
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_tpr_idx ON rev_txn_price_rev(company_id, change_order_id);

COMMIT;
