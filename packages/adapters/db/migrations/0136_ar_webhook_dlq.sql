BEGIN;

CREATE TABLE IF NOT EXISTS ar_gateway_webhook_dlq (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  gateway     TEXT NOT NULL,
  payload     JSONB NOT NULL,
  reason      TEXT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  retry_at    timestamptz
);

COMMIT;
