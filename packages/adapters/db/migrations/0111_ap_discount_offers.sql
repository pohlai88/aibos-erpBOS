BEGIN;

CREATE TABLE IF NOT EXISTS ap_discount_offer (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  invoice_id  TEXT NOT NULL,
  offer_pct   NUMERIC NOT NULL,       -- % discount requested
  pay_by_date DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('proposed','accepted','declined','expired')),
  token       TEXT NOT NULL,          -- opaque acceptance token (email/webhook)
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL,
  decided_at  timestamptz,
  decided_by  TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS ap_discount_offer_inv_uk ON ap_discount_offer(company_id, invoice_id, status) WHERE status IN ('proposed','accepted');
CREATE INDEX IF NOT EXISTS ap_discount_offer_status_idx ON ap_discount_offer(company_id, status, pay_by_date);

COMMIT;

