BEGIN;

CREATE TABLE IF NOT EXISTS bank_conn_profile (
  company_id TEXT NOT NULL,
  bank_code  TEXT NOT NULL,      -- e.g. 'HSBC-MY','DBS-SG'
  kind       TEXT NOT NULL CHECK (kind IN ('SFTP','API')),
  config     JSONB NOT NULL,     -- { host, port, username, key_ref, api_base, auth_ref, out_dir, in_dir }
  active     BOOLEAN NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, bank_code)
);

CREATE TABLE IF NOT EXISTS bank_fetch_cursor (
  company_id TEXT NOT NULL,
  bank_code  TEXT NOT NULL,
  channel    TEXT NOT NULL CHECK (channel IN ('pain002','camt054')),
  cursor     TEXT,               -- last filename/time/offset; adapter-specific
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, bank_code, channel)
);

COMMIT;
