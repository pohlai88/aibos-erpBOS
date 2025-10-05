-- M28.3: Componentized ROU & Impairment - Foreign Key Hardening
-- Migration: 0305_fk_hardening.sql

-- Add foreign key constraints with proper on-delete rules
ALTER TABLE lease_component 
ADD CONSTRAINT fk_lease_component_lease 
FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_component_sched 
ADD CONSTRAINT fk_lease_component_sched_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_component_link 
ADD CONSTRAINT fk_lease_component_link_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_impair_line 
ADD CONSTRAINT fk_lease_impair_line_test 
FOREIGN KEY (impair_test_id) REFERENCES lease_impair_test(id) ON DELETE CASCADE;

ALTER TABLE lease_impair_line 
ADD CONSTRAINT fk_lease_impair_line_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_impair_post 
ADD CONSTRAINT fk_lease_impair_post_test 
FOREIGN KEY (impair_test_id) REFERENCES lease_impair_test(id) ON DELETE CASCADE;

ALTER TABLE lease_impair_post_lock 
ADD CONSTRAINT fk_lease_impair_post_lock_test 
FOREIGN KEY (impair_test_id) REFERENCES lease_impair_test(id) ON DELETE CASCADE;

ALTER TABLE lease_restoration_prov 
ADD CONSTRAINT fk_lease_restoration_prov_lease 
FOREIGN KEY (lease_id) REFERENCES lease(id) ON DELETE CASCADE;

ALTER TABLE lease_restoration_prov 
ADD CONSTRAINT fk_lease_restoration_prov_component 
FOREIGN KEY (component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

-- Add check constraints for data integrity
ALTER TABLE lease_component 
ADD CONSTRAINT chk_lease_component_pct_sum 
CHECK (pct_of_rou > 0 AND pct_of_rou <= 1);

ALTER TABLE lease_component 
ADD CONSTRAINT chk_lease_component_useful_life 
CHECK (useful_life_months > 0);

ALTER TABLE lease_impair_test 
ADD CONSTRAINT chk_lease_impair_test_discount_rate 
CHECK (discount_rate > 0 AND discount_rate < 1);

ALTER TABLE lease_impair_test 
ADD CONSTRAINT chk_lease_impair_test_recoverable_amount 
CHECK (recoverable_amount >= 0);
