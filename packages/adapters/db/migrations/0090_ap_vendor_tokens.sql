BEGIN;
CREATE TABLE IF NOT EXISTS ap_vendor_token (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  token       TEXT NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMIT;
