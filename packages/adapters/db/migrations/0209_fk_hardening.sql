-- M26.1: Auto-Controls & Certifications - Foreign Key Hardening
-- Migration: 0209_fk_hardening.sql

-- Add foreign key constraints and cascades for controls tables

-- Control assignments foreign keys
ALTER TABLE ctrl_assignment 
ADD CONSTRAINT fk_ctrl_assignment_control 
FOREIGN KEY (control_id) REFERENCES ctrl_control(id) ON DELETE CASCADE;

ALTER TABLE ctrl_assignment 
ADD CONSTRAINT fk_ctrl_assignment_close_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

ALTER TABLE ctrl_assignment 
ADD CONSTRAINT fk_ctrl_assignment_close_task 
FOREIGN KEY (task_id) REFERENCES close_task(id) ON DELETE CASCADE;

-- Control runs foreign keys
ALTER TABLE ctrl_run 
ADD CONSTRAINT fk_ctrl_run_control 
FOREIGN KEY (control_id) REFERENCES ctrl_control(id) ON DELETE CASCADE;

ALTER TABLE ctrl_run 
ADD CONSTRAINT fk_ctrl_run_assignment 
FOREIGN KEY (assignment_id) REFERENCES ctrl_assignment(id) ON DELETE CASCADE;

ALTER TABLE ctrl_run 
ADD CONSTRAINT fk_ctrl_run_close_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

-- Control results foreign keys
ALTER TABLE ctrl_result 
ADD CONSTRAINT fk_ctrl_result_run 
FOREIGN KEY (ctrl_run_id) REFERENCES ctrl_run(id) ON DELETE CASCADE;

-- Control exceptions foreign keys
ALTER TABLE ctrl_exception 
ADD CONSTRAINT fk_ctrl_exception_run 
FOREIGN KEY (ctrl_run_id) REFERENCES ctrl_run(id) ON DELETE CASCADE;

-- Control evidence foreign keys
ALTER TABLE ctrl_evidence 
ADD CONSTRAINT fk_ctrl_evidence_run 
FOREIGN KEY (ctrl_run_id) REFERENCES ctrl_run(id) ON DELETE CASCADE;

-- Certification sign-offs foreign keys
ALTER TABLE cert_signoff 
ADD CONSTRAINT fk_cert_signoff_close_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

ALTER TABLE cert_signoff 
ADD CONSTRAINT fk_cert_signoff_statement 
FOREIGN KEY (statement_id) REFERENCES cert_statement(id) ON DELETE RESTRICT;

-- Comments for documentation
COMMENT ON TABLE ctrl_assignment IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ctrl_run IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ctrl_result IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ctrl_exception IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ctrl_evidence IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE cert_signoff IS 'Foreign key constraints added for referential integrity';
