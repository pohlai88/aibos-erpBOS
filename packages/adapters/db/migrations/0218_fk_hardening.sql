-- M26.2: Close Insights & Benchmarks - Foreign Key Hardening
-- Migration: 0218_fk_hardening.sql

-- Add foreign key constraints for insights tables

-- Close facts foreign keys
ALTER TABLE ins_fact_close 
ADD CONSTRAINT fk_ins_fact_close_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

-- Task facts foreign keys
ALTER TABLE ins_fact_task 
ADD CONSTRAINT fk_ins_fact_task_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

ALTER TABLE ins_fact_task 
ADD CONSTRAINT fk_ins_fact_task_task 
FOREIGN KEY (task_id) REFERENCES close_task(id) ON DELETE CASCADE;

-- Control facts foreign keys
ALTER TABLE ins_fact_ctrl 
ADD CONSTRAINT fk_ins_fact_ctrl_run 
FOREIGN KEY (ctrl_run_id) REFERENCES ctrl_run(id) ON DELETE CASCADE;

-- Flux facts foreign keys
ALTER TABLE ins_fact_flux 
ADD CONSTRAINT fk_ins_fact_flux_run 
FOREIGN KEY (flux_run_id) REFERENCES flux_run(id) ON DELETE CASCADE;

-- Certification facts foreign keys
ALTER TABLE ins_fact_cert 
ADD CONSTRAINT fk_ins_fact_cert_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

-- Anomaly foreign keys
ALTER TABLE ins_anomaly 
ADD CONSTRAINT fk_ins_anomaly_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

-- Recommendation foreign keys
ALTER TABLE ins_reco 
ADD CONSTRAINT fk_ins_reco_run 
FOREIGN KEY (run_id) REFERENCES close_run(id) ON DELETE CASCADE;

-- Comments for documentation
COMMENT ON TABLE ins_fact_close IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ins_fact_task IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ins_fact_ctrl IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ins_fact_flux IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ins_fact_cert IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ins_anomaly IS 'Foreign key constraints added for referential integrity';
COMMENT ON TABLE ins_reco IS 'Foreign key constraints added for referential integrity';
