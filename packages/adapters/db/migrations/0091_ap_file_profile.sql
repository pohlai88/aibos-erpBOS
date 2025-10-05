BEGIN;
CREATE TABLE IF NOT EXISTS ap_file_profile (
  company_id TEXT NOT NULL,
  bank_code  TEXT NOT NULL,            -- e.g., 'HSBC-MY','DBS-SG'
  format     TEXT NOT NULL,            -- 'PAIN_001'|'CSV'
  profile    JSONB NOT NULL,           -- creditor id, service level, batch booking, etc.
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, bank_code)
);
COMMIT;
