BEGIN;

-- Revenue & Billing Invoice Artifacts Table
CREATE TABLE rb_invoice_artifact (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES rb_invoice(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('PDF','CSV','JSON')),
  filename TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  bytes INT NOT NULL,
  storage_uri TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
