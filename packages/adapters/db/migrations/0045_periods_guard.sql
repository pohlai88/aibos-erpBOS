-- 0045_periods_guard.sql
-- Formalize period policy enforcement with normalized periods table

BEGIN;

-- Create normalized periods table for global enforcement
CREATE TABLE IF NOT EXISTS periods (
  company_id TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  state TEXT NOT NULL CHECK (state IN ('open','pending_close','closed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, year, month)
);

-- Helpful partial index for closed lookups
CREATE INDEX IF NOT EXISTS periods_closed_idx
ON periods(company_id, year, month)
WHERE state <> 'open';

-- Index for open period lookups
CREATE INDEX IF NOT EXISTS periods_open_idx
ON periods(company_id, year, month)
WHERE state = 'open';

-- Migrate existing accounting_period data to new format
INSERT INTO periods (company_id, year, month, state, updated_by)
SELECT 
  company_id,
  EXTRACT(YEAR FROM start_date)::int as year,
  EXTRACT(MONTH FROM start_date)::int as month,
  CASE 
    WHEN status = 'OPEN' THEN 'open'
    WHEN status = 'CLOSED' THEN 'closed'
    ELSE 'pending_close'
  END as state,
  'migration' as updated_by
FROM accounting_period
WHERE NOT EXISTS (
  SELECT 1 FROM periods p 
  WHERE p.company_id = accounting_period.company_id 
    AND p.year = EXTRACT(YEAR FROM start_date)::int
    AND p.month = EXTRACT(MONTH FROM start_date)::int
);

COMMIT;
