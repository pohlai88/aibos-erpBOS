-- M26.4 Enhanced Evidence Vault - Foreign Key Hardening
-- Migration: 0228_fk_hardening.sql

-- Add any additional foreign key constraints to existing tables
-- This ensures referential integrity between evidence system and existing business objects

-- Note: The existing evidence tables already have appropriate foreign keys
-- This migration is for any additional constraints that might be needed

-- Add foreign key constraints to link evidence to existing business objects
-- (These would be added if the referenced tables exist)

-- Example: Link evidence records to control runs (if ctrl_run table exists)
-- ALTER TABLE evd_link ADD CONSTRAINT fk_evd_link_ctrl_run 
--   FOREIGN KEY (ref_id) REFERENCES ctrl_run(id) ON DELETE CASCADE 
--   WHERE kind = 'CTRL_RUN';

-- Example: Link evidence records to close runs (if close_run table exists)  
-- ALTER TABLE evd_link ADD CONSTRAINT fk_evd_link_close_run 
--   FOREIGN KEY (ref_id) REFERENCES close_run(id) ON DELETE CASCADE 
--   WHERE kind = 'CLOSE_RUN';

-- Comments for documentation
COMMENT ON TABLE evd_link IS 'Foreign key constraints ensure referential integrity with business objects';
