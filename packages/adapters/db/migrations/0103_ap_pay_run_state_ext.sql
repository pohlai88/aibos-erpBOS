BEGIN;
-- add timestamps for machine stage
ALTER TABLE ap_pay_run
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_reason TEXT;
COMMIT;
