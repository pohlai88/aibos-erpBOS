BEGIN;
CREATE TABLE IF NOT EXISTS ar_collections_kpi (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  as_of_date  DATE NOT NULL,
  customer_id TEXT,
  dso         NUMERIC,
  disputes_open INT,
  ptp_open    INT,
  exposure    NUMERIC,      -- open AR + promised
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ar_col_kpi_idx ON ar_collections_kpi(company_id, as_of_date);
COMMIT;
