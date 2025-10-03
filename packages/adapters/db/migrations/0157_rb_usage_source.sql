BEGIN;

-- Revenue & Billing Usage Source Table
CREATE TABLE rb_usage_source (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,                        -- 'API','CSV','S3','KAFKA'
  config JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);
CREATE UNIQUE INDEX rb_usage_source_uk ON rb_usage_source(company_id, code);

COMMIT;
