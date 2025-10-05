BEGIN;

CREATE TABLE IF NOT EXISTS fx_admin_rates (
  company_id TEXT NOT NULL,
  as_of_date DATE NOT NULL,           -- use last day of month for monthly reports
  src_ccy    TEXT NOT NULL,
  dst_ccy    TEXT NOT NULL,
  rate       NUMERIC NOT NULL,        -- amount * rate -> dst_ccy
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, as_of_date, src_ccy, dst_ccy)
);

COMMIT;
