-- M26.6: Close Cockpit & SLA Board - Foreign Key Hardening
-- Ensure referential integrity with existing M26.x artifacts

-- Add foreign key constraints to existing tables where applicable
-- These will be added based on the actual schema relationships

-- Example FK constraints (adjust based on actual schema):
-- ALTER TABLE close_item ADD CONSTRAINT fk_close_item_company 
--   FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

-- ALTER TABLE close_item ADD CONSTRAINT fk_close_item_owner 
--   FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE SET NULL;

-- ALTER TABLE close_sla_policy ADD CONSTRAINT fk_close_sla_policy_company 
--   FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

-- ALTER TABLE close_sla_policy ADD CONSTRAINT fk_close_sla_policy_escal1 
--   FOREIGN KEY (escal_to_lvl1) REFERENCES app_user(id) ON DELETE SET NULL;

-- ALTER TABLE close_sla_policy ADD CONSTRAINT fk_close_sla_policy_escal2 
--   FOREIGN KEY (escal_to_lvl2) REFERENCES app_user(id) ON DELETE SET NULL;
