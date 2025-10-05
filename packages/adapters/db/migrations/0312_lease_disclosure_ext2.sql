-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0312_lease_disclosure_ext2.sql

-- Extend lease_disclosure with new columns for M28.4
ALTER TABLE lease_disclosure ADD COLUMN remeasurements NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN concessions NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN scope_changes NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN term_changes NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE lease_disclosure ADD COLUMN indexation_effect NUMERIC(15,2) NOT NULL DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN lease_disclosure.remeasurements IS 'Total remeasurement adjustments for the period';
COMMENT ON COLUMN lease_disclosure.concessions IS 'Total concession adjustments for the period';
COMMENT ON COLUMN lease_disclosure.scope_changes IS 'Total scope change adjustments for the period';
COMMENT ON COLUMN lease_disclosure.term_changes IS 'Total term change adjustments for the period';
COMMENT ON COLUMN lease_disclosure.indexation_effect IS 'Total indexation effect for the period';
