BEGIN;

CREATE TABLE IF NOT EXISTS ap_pay_export (
  id         TEXT PRIMARY KEY,
  run_id     TEXT NOT NULL REFERENCES ap_pay_run(id) ON DELETE CASCADE,
  format     TEXT NOT NULL,            -- 'PAIN_001','CSV'
  filename   TEXT NOT NULL,
  payload    TEXT NOT NULL,            -- XML/CSV snapshot
  checksum   TEXT NOT NULL,            -- sha256
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ap_remittance (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL REFERENCES ap_pay_run(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  address     TEXT,                    -- email or webhook endpoint
  status      TEXT NOT NULL CHECK (status IN ('queued','sent','failed')),
  sent_at     timestamptz,
  response    TEXT
);

COMMIT;
