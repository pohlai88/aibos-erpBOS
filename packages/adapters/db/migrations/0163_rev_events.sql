BEGIN;

-- Revenue Recognition Events (M25.1)
-- Event-driven revenue recognition triggers

CREATE TABLE rev_event (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  pob_id TEXT NOT NULL REFERENCES rev_pob(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ACTIVATE','FULFILL','PAUSE','RESUME','CANCEL','REFUND','USAGE_REPORT')),
  payload JSONB,                                     -- event-specific data
  processed_at timestamptz,                          -- when event was processed
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_event_idx ON rev_event(company_id, pob_id, occurred_at);
CREATE INDEX rev_event_kind_idx ON rev_event(company_id, kind, occurred_at);
CREATE INDEX rev_event_processed_idx ON rev_event(company_id, processed_at) WHERE processed_at IS NULL;

COMMIT;
