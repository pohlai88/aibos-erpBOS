BEGIN;
CREATE TABLE IF NOT EXISTS ar_collections_note (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_id  TEXT,
  kind        TEXT NOT NULL CHECK (kind IN ('CALL','EMAIL','MEETING','NOTE')),
  body        TEXT NOT NULL,
  next_action_date DATE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL
);
COMMIT;
