BEGIN;
-- optional tags for mapping, if not present
ALTER TABLE gl_accounts ADD COLUMN IF NOT EXISTS cash_equivalent BOOLEAN;
COMMIT;
