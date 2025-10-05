-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - Disclosure Extensions
-- Migration: 0332_disclosure_ext4.sql

-- Extend lease_disclosure table with impairment and onerous data
ALTER TABLE lease_disclosure ADD COLUMN IF NOT EXISTS impairment_loss NUMERIC(18,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN IF NOT EXISTS impairment_reversal NUMERIC(18,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN IF NOT EXISTS onerous_charge NUMERIC(18,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN IF NOT EXISTS onerous_unwind NUMERIC(18,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN IF NOT EXISTS onerous_utilization NUMERIC(18,2) DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN IF NOT EXISTS onerous_closing NUMERIC(18,2) DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN lease_disclosure.impairment_loss IS 'Impairment loss recognized during period (IAS 36)';
COMMENT ON COLUMN lease_disclosure.impairment_reversal IS 'Impairment reversal recognized during period (IAS 36)';
COMMENT ON COLUMN lease_disclosure.onerous_charge IS 'Onerous contract provision charged during period (IAS 37)';
COMMENT ON COLUMN lease_disclosure.onerous_unwind IS 'Onerous contract provision unwind during period (IAS 37)';
COMMENT ON COLUMN lease_disclosure.onerous_utilization IS 'Onerous contract provision utilized during period (IAS 37)';
COMMENT ON COLUMN lease_disclosure.onerous_closing IS 'Onerous contract provision closing balance (IAS 37)';
