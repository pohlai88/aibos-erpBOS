BEGIN;

CREATE TABLE IF NOT EXISTS ap_payee_kyc (
  company_id   TEXT NOT NULL,
  supplier_id  TEXT NOT NULL,
  residency    TEXT,                       -- country code
  tax_form     TEXT,                       -- 'W9','W8BEN','W8BENE','LOCAL'
  tax_id       TEXT,
  doc_type     TEXT,                       -- 'CERT','LICENSE','PASSPORT'
  doc_ref      TEXT,
  doc_expires  DATE,
  risk_level   TEXT CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  on_hold      BOOLEAN NOT NULL DEFAULT false,
  notes        TEXT,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS ap_payee_kyc_expiry_idx ON ap_payee_kyc(company_id, doc_expires);

COMMIT;
