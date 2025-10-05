-- M28.6: Lease Impairment & Onerous Contracts - Foreign Key Hardening
-- Migration: 0336_fk_hardening.sql

-- Add foreign key constraints with proper cascade behavior
ALTER TABLE lease_cgu_link 
ADD CONSTRAINT fk_lease_cgu_link_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_cgu_link 
ADD CONSTRAINT fk_lease_cgu_link_cgu 
FOREIGN KEY (cgu_id) REFERENCES lease_cgu(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_indicator 
ADD CONSTRAINT fk_lease_imp_indicator_cgu 
FOREIGN KEY (cgu_id) REFERENCES lease_cgu(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_indicator 
ADD CONSTRAINT fk_lease_imp_indicator_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_test 
ADD CONSTRAINT fk_lease_imp_test_cgu 
FOREIGN KEY (cgu_id) REFERENCES lease_cgu(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_line 
ADD CONSTRAINT fk_lease_imp_line_test 
FOREIGN KEY (test_id) REFERENCES lease_imp_test(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_line 
ADD CONSTRAINT fk_lease_imp_line_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_post_lock 
ADD CONSTRAINT fk_lease_imp_post_lock_test 
FOREIGN KEY (test_id) REFERENCES lease_imp_test(id) ON DELETE CASCADE;

ALTER TABLE onerous_assessment 
ADD CONSTRAINT fk_onerous_assessment_component 
FOREIGN KEY (lease_component_id) REFERENCES lease_component(id) ON DELETE CASCADE;

ALTER TABLE onerous_roll 
ADD CONSTRAINT fk_onerous_roll_assessment 
FOREIGN KEY (assessment_id) REFERENCES onerous_assessment(id) ON DELETE CASCADE;

ALTER TABLE onerous_post_lock 
ADD CONSTRAINT fk_onerous_post_lock_assessment 
FOREIGN KEY (assessment_id) REFERENCES onerous_assessment(id) ON DELETE CASCADE;

ALTER TABLE lease_imp_evidence 
ADD CONSTRAINT fk_lease_imp_evidence_test 
FOREIGN KEY (test_id) REFERENCES lease_imp_test(id) ON DELETE CASCADE;

ALTER TABLE onerous_evidence 
ADD CONSTRAINT fk_onerous_evidence_assessment 
FOREIGN KEY (assessment_id) REFERENCES onerous_assessment(id) ON DELETE CASCADE;