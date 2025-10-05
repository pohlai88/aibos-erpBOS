-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Foreign Key Hardening
-- Migration: 0324_fk_hardening.sql

-- Add foreign key constraints for sublease tables
ALTER TABLE sublease ADD CONSTRAINT fk_sublease_head_lease 
    FOREIGN KEY (head_lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE sublease_cf ADD CONSTRAINT fk_sublease_cf_sublease 
    FOREIGN KEY (sublease_id) REFERENCES sublease(id) ON DELETE CASCADE;

ALTER TABLE sublease_schedule ADD CONSTRAINT fk_sublease_schedule_sublease 
    FOREIGN KEY (sublease_id) REFERENCES sublease(id) ON DELETE CASCADE;

ALTER TABLE sublease_event ADD CONSTRAINT fk_sublease_event_sublease 
    FOREIGN KEY (sublease_id) REFERENCES sublease(id) ON DELETE CASCADE;

ALTER TABLE sublease_post_lock ADD CONSTRAINT fk_sublease_post_lock_sublease 
    FOREIGN KEY (sublease_id) REFERENCES sublease(id) ON DELETE CASCADE;

-- Add foreign key constraints for SLB tables
ALTER TABLE slb_txn ADD CONSTRAINT fk_slb_txn_leaseback 
    FOREIGN KEY (leaseback_id) REFERENCES lease(id) ON DELETE SET NULL;

ALTER TABLE slb_allocation ADD CONSTRAINT fk_slb_allocation_slb 
    FOREIGN KEY (slb_id) REFERENCES slb_txn(id) ON DELETE CASCADE;

ALTER TABLE slb_measure ADD CONSTRAINT fk_slb_measure_slb 
    FOREIGN KEY (slb_id) REFERENCES slb_txn(id) ON DELETE CASCADE;

-- Add foreign key constraints for lease component sublet
ALTER TABLE lease_component_sublet ADD CONSTRAINT fk_lease_component_sublet_component 
    FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_component_sublet ADD CONSTRAINT fk_lease_component_sublet_sublease 
    FOREIGN KEY (sublease_id) REFERENCES sublease(id) ON DELETE CASCADE;
