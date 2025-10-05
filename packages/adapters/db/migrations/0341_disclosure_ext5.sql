-- M28.7: Lease Derecognition - Disclosure Extensions
-- Migration: 0341_disclosure_ext5.sql

-- Extend lease_disclosure with exit-related fields
ALTER TABLE lease_disclosure 
ADD COLUMN terminations NUMERIC(18,2) NOT NULL DEFAULT 0, -- total termination amounts
ADD COLUMN partial_derecognition NUMERIC(18,2) NOT NULL DEFAULT 0, -- partial termination amounts
ADD COLUMN buyouts NUMERIC(18,2) NOT NULL DEFAULT 0, -- buyout amounts
ADD COLUMN restoration_charge NUMERIC(18,2) NOT NULL DEFAULT 0, -- restoration provision charged
ADD COLUMN restoration_unwind NUMERIC(18,2) NOT NULL DEFAULT 0, -- restoration provision unwind
ADD COLUMN restoration_utilization NUMERIC(18,2) NOT NULL DEFAULT 0; -- restoration provision utilized

-- Comments for new columns
COMMENT ON COLUMN lease_disclosure.terminations IS 'Total amount of lease terminations during the period';
COMMENT ON COLUMN lease_disclosure.partial_derecognition IS 'Total amount of partial lease derecognitions during the period';
COMMENT ON COLUMN lease_disclosure.buyouts IS 'Total amount of lease buyouts during the period';
COMMENT ON COLUMN lease_disclosure.restoration_charge IS 'Restoration provision charged during the period';
COMMENT ON COLUMN lease_disclosure.restoration_unwind IS 'Restoration provision unwind (finance cost) during the period';
COMMENT ON COLUMN lease_disclosure.restoration_utilization IS 'Restoration provision utilized during the period';
