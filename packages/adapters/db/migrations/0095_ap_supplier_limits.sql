BEGIN;

CREATE TABLE IF NOT EXISTS ap_supplier_limit (
  company_id  TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  day_cap     NUMERIC,   -- per day
  run_cap     NUMERIC,   -- per run
  year_cap    NUMERIC,   -- per fiscal year
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (company_id, supplier_id)
);
COMMIT;
