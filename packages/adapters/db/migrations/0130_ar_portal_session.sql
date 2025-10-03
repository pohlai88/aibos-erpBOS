BEGIN;

CREATE TABLE IF NOT EXISTS ar_portal_session (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  customer_id  TEXT NOT NULL,
  token        TEXT NOT NULL,              -- opaque, random
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL,
  meta         JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS ar_portal_token_uk ON ar_portal_session(token);
CREATE INDEX IF NOT EXISTS ar_portal_exp_idx ON ar_portal_session(company_id, expires_at);

COMMIT;
