BEGIN;
-- Enrich chart with class tags for policy
ALTER TABLE account ADD COLUMN IF NOT EXISTS class TEXT
  CHECK (class IN ('ASSET','LIAB','EQUITY','REVENUE','EXPENSE'));
COMMIT;
