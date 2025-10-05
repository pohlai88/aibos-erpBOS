-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0315_fk_hardening.sql

-- Add foreign key constraints for M28.4 tables
ALTER TABLE lease_index_profile ADD CONSTRAINT fk_lease_index_profile_lease 
    FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_mod ADD CONSTRAINT fk_lease_mod_lease 
    FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_mod_line ADD CONSTRAINT fk_lease_mod_line_mod 
    FOREIGN KEY (mod_id) REFERENCES lease_mod(id) ON DELETE CASCADE;

ALTER TABLE lease_mod_line ADD CONSTRAINT fk_lease_mod_line_component 
    FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_remeasure_post ADD CONSTRAINT fk_lease_remeasure_post_lease 
    FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_remeasure_post ADD CONSTRAINT fk_lease_remeasure_post_mod 
    FOREIGN KEY (mod_id) REFERENCES lease_mod(id) ON DELETE CASCADE;

ALTER TABLE lease_component_sched_delta ADD CONSTRAINT fk_lease_sched_delta_component 
    FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_component_sched_delta ADD CONSTRAINT fk_lease_sched_delta_mod 
    FOREIGN KEY (mod_id) REFERENCES lease_mod(id) ON DELETE CASCADE;
