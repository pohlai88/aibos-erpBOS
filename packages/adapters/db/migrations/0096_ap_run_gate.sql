BEGIN;
-- A simple lock that ensures steps are performed in order & once
CREATE TABLE IF NOT EXISTS ap_run_gate (
  company_id TEXT NOT NULL,
  run_id     TEXT NOT NULL,
  gate       TEXT NOT NULL CHECK (gate IN ('reviewed','approved','approved2','screened','executed')),
  PRIMARY KEY (company_id, run_id, gate)
);
COMMIT;
