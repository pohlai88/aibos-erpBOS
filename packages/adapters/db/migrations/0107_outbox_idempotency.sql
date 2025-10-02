-- Add business key for idempotency
ALTER TABLE bank_outbox ADD COLUMN IF NOT EXISTS business_key text;
CREATE UNIQUE INDEX IF NOT EXISTS bank_outbox_idem_uk
  ON bank_outbox (company_id, business_key) WHERE business_key IS NOT NULL;
