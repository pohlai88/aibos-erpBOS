BEGIN;

-- pain.002 acknowledgments mapped to runs/lines
CREATE TABLE IF NOT EXISTS bank_ack (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  bank_code  TEXT NOT NULL,
  ack_kind   TEXT NOT NULL CHECK (ack_kind IN ('pain002','camt054')),
  filename   TEXT NOT NULL,
  payload    TEXT NOT NULL,          -- raw xml/csv
  uniq_hash  TEXT NOT NULL,          -- idempotency
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bank_ack_uk ON bank_ack(company_id, bank_code, uniq_hash);

-- Parsed result linking to run/line with reason codes
CREATE TABLE IF NOT EXISTS bank_ack_map (
  id             TEXT PRIMARY KEY,
  ack_id         TEXT NOT NULL REFERENCES bank_ack(id) ON DELETE CASCADE,
  run_id         TEXT,
  line_id        TEXT,
  status         TEXT NOT NULL CHECK (status IN ('ack','exec_ok','exec_fail','partial')),
  reason_code    TEXT,               -- bank-specific code
  reason_label   TEXT                -- normalized label
);

COMMIT;
