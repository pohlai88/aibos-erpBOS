BEGIN;

ALTER TABLE ar_invoice
  ADD COLUMN IF NOT EXISTS portal_link TEXT;  -- cached in emails

COMMIT;
