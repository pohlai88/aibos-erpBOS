BEGIN;

CREATE TABLE IF NOT EXISTS sanction_adapter_profile (
  company_id TEXT NOT NULL,
  adapter    TEXT NOT NULL,         -- 'LOCAL','CSV','API'
  config     JSONB NOT NULL,        -- endpoints, keys, CSV url, schedule
  active     BOOLEAN NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, adapter)
);
COMMIT;
