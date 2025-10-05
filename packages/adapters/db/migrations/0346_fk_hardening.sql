-- M28.7: Lease Derecognition - Foreign Key Hardening
-- Migration: 0346_fk_hardening.sql

-- Add foreign key constraints for data integrity
ALTER TABLE lease_exit 
ADD CONSTRAINT fk_lease_exit_lease 
FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_exit 
ADD CONSTRAINT fk_lease_exit_component 
FOREIGN KEY (component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_exit_calc 
ADD CONSTRAINT fk_lease_exit_calc_exit 
FOREIGN KEY (exit_id) REFERENCES lease_exit(id) ON DELETE CASCADE;

ALTER TABLE lease_exit_fx 
ADD CONSTRAINT fk_lease_exit_fx_exit 
FOREIGN KEY (exit_id) REFERENCES lease_exit(id) ON DELETE CASCADE;

ALTER TABLE lease_exit_post_lock 
ADD CONSTRAINT fk_lease_exit_post_lock_lease 
FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_exit_post_lock 
ADD CONSTRAINT fk_lease_exit_post_lock_component 
FOREIGN KEY (component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_restoration 
ADD CONSTRAINT fk_lease_restoration_lease 
FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_restoration 
ADD CONSTRAINT fk_lease_restoration_component 
FOREIGN KEY (component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_buyout_fa_link 
ADD CONSTRAINT fk_lease_buyout_fa_link_exit 
FOREIGN KEY (exit_id) REFERENCES lease_exit(id) ON DELETE CASCADE;

ALTER TABLE lease_exit_evidence 
ADD CONSTRAINT fk_lease_exit_evidence_exit 
FOREIGN KEY (exit_id) REFERENCES lease_exit(id) ON DELETE CASCADE;

-- Add check constraints for data integrity
ALTER TABLE lease_exit 
ADD CONSTRAINT chk_lease_exit_settlement_penalty 
CHECK (settlement >= 0 OR penalty >= 0); -- At least one should be non-negative

ALTER TABLE lease_exit_calc 
ADD CONSTRAINT chk_lease_exit_calc_share_pct 
CHECK (share_pct >= 0 AND share_pct <= 100); -- Share percentage between 0 and 100

ALTER TABLE lease_exit_fx 
ADD CONSTRAINT chk_lease_exit_fx_spot_rate 
CHECK (spot > 0); -- Spot rate must be positive

ALTER TABLE lease_restoration 
ADD CONSTRAINT chk_lease_restoration_estimate 
CHECK (estimate >= 0); -- Estimate must be non-negative

ALTER TABLE lease_restoration 
ADD CONSTRAINT chk_lease_restoration_discount_rate 
CHECK (discount_rate >= 0 AND discount_rate <= 1); -- Discount rate between 0 and 1

ALTER TABLE lease_buyout_fa_link 
ADD CONSTRAINT chk_lease_buyout_fa_link_amount 
CHECK (transfer_amount >= 0); -- Transfer amount must be non-negative

-- Comments for documentation
COMMENT ON CONSTRAINT fk_lease_exit_lease ON lease_exit IS 'Foreign key to lease table';
COMMENT ON CONSTRAINT fk_lease_exit_component ON lease_exit IS 'Foreign key to lease_component table (nullable)';
COMMENT ON CONSTRAINT fk_lease_exit_calc_exit ON lease_exit_calc IS 'Foreign key to lease_exit table';
COMMENT ON CONSTRAINT fk_lease_exit_fx_exit ON lease_exit_fx IS 'Foreign key to lease_exit table';
COMMENT ON CONSTRAINT fk_lease_exit_post_lock_lease ON lease_exit_post_lock IS 'Foreign key to lease table (nullable)';
COMMENT ON CONSTRAINT fk_lease_exit_post_lock_component ON lease_exit_post_lock IS 'Foreign key to lease_component table (nullable)';
COMMENT ON CONSTRAINT fk_lease_restoration_lease ON lease_restoration IS 'Foreign key to lease table';
COMMENT ON CONSTRAINT fk_lease_restoration_component ON lease_restoration IS 'Foreign key to lease_component table (nullable)';
COMMENT ON CONSTRAINT fk_lease_buyout_fa_link_exit ON lease_buyout_fa_link IS 'Foreign key to lease_exit table';
COMMENT ON CONSTRAINT fk_lease_exit_evidence_exit ON lease_exit_evidence IS 'Foreign key to lease_exit table';
