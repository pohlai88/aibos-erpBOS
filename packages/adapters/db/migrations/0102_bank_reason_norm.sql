BEGIN;

CREATE TABLE IF NOT EXISTS bank_reason_norm (
  bank_code    TEXT NOT NULL,
  code         TEXT NOT NULL,
  norm_status  TEXT NOT NULL CHECK (norm_status IN ('ack','exec_ok','exec_fail','partial')),
  norm_label   TEXT NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bank_code, code)
);

COMMIT;
