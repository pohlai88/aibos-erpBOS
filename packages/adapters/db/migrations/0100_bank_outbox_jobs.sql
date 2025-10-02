BEGIN;

CREATE TABLE IF NOT EXISTS bank_outbox (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  run_id     TEXT NOT NULL,          -- ap_pay_run.id
  bank_code  TEXT NOT NULL,
  filename   TEXT NOT NULL,
  payload    TEXT NOT NULL,          -- PAIN.001 content
  checksum   TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('queued','sent','error','ignored')),
  attempts   INT  NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at    timestamptz
);

CREATE TABLE IF NOT EXISTS bank_job_log (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  bank_code  TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('DISPATCH','FETCH')),
  detail     TEXT NOT NULL,          -- human readable summary
  payload    TEXT,                   -- request/response snippet
  success    BOOLEAN NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
