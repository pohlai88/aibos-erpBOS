BEGIN;

-- Idempotency table for M24.2 Customer Portal
-- Prevents duplicate operations using Idempotency-Key header
CREATE TABLE IF NOT EXISTS portal_idempotency (
  key           TEXT NOT NULL,
  company_id    TEXT NOT NULL,
  purpose       TEXT NOT NULL,
  result        JSONB NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, company_id)
);

-- Index for cleanup of expired records
CREATE INDEX IF NOT EXISTS portal_idempotency_created_idx ON portal_idempotency(created_at);

COMMIT;
