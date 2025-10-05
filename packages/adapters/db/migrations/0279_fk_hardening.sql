-- M26.9: ITGC & UAR Bridge - Foreign Key Hardening
-- Migration: 0279_fk_hardening.sql

-- Add foreign key constraints for referential integrity

-- IT Users foreign keys
ALTER TABLE it_user ADD CONSTRAINT fk_it_user_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;

-- IT Roles foreign keys  
ALTER TABLE it_role ADD CONSTRAINT fk_it_role_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;

-- IT Entitlements foreign keys
ALTER TABLE it_entitlement ADD CONSTRAINT fk_it_entitlement_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;

-- IT Grants foreign keys
ALTER TABLE it_grant ADD CONSTRAINT fk_it_grant_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;
ALTER TABLE it_grant ADD CONSTRAINT fk_it_grant_user 
  FOREIGN KEY (user_id) REFERENCES it_user(id) ON DELETE CASCADE;
ALTER TABLE it_grant ADD CONSTRAINT fk_it_grant_entitlement 
  FOREIGN KEY (entitlement_id) REFERENCES it_entitlement(id) ON DELETE CASCADE;

-- SoD Violations foreign keys
ALTER TABLE it_sod_violation ADD CONSTRAINT fk_it_sod_violation_rule 
  FOREIGN KEY (rule_id) REFERENCES it_sod_rule(id) ON DELETE CASCADE;
ALTER TABLE it_sod_violation ADD CONSTRAINT fk_it_sod_violation_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;
ALTER TABLE it_sod_violation ADD CONSTRAINT fk_it_sod_violation_user 
  FOREIGN KEY (user_id) REFERENCES it_user(id) ON DELETE CASCADE;

-- UAR Items foreign keys
ALTER TABLE uar_item ADD CONSTRAINT fk_uar_item_campaign 
  FOREIGN KEY (campaign_id) REFERENCES uar_campaign(id) ON DELETE CASCADE;
ALTER TABLE uar_item ADD CONSTRAINT fk_uar_item_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;
ALTER TABLE uar_item ADD CONSTRAINT fk_uar_item_user 
  FOREIGN KEY (user_id) REFERENCES it_user(id) ON DELETE CASCADE;

-- UAR Packs foreign keys
ALTER TABLE uar_pack ADD CONSTRAINT fk_uar_pack_campaign 
  FOREIGN KEY (campaign_id) REFERENCES uar_campaign(id) ON DELETE CASCADE;

-- Break-glass foreign keys
ALTER TABLE it_breakglass ADD CONSTRAINT fk_it_breakglass_system 
  FOREIGN KEY (system_id) REFERENCES it_system(id) ON DELETE CASCADE;
ALTER TABLE it_breakglass ADD CONSTRAINT fk_it_breakglass_user 
  FOREIGN KEY (user_id) REFERENCES it_user(id) ON DELETE CASCADE;

-- Comments for documentation
COMMENT ON CONSTRAINT fk_it_user_system ON it_user IS 'Ensures IT users belong to valid systems';
COMMENT ON CONSTRAINT fk_it_role_system ON it_role IS 'Ensures IT roles belong to valid systems';
COMMENT ON CONSTRAINT fk_it_entitlement_system ON it_entitlement IS 'Ensures entitlements belong to valid systems';
COMMENT ON CONSTRAINT fk_it_grant_system ON it_grant IS 'Ensures grants belong to valid systems';
COMMENT ON CONSTRAINT fk_it_grant_user ON it_grant IS 'Ensures grants belong to valid users';
COMMENT ON CONSTRAINT fk_it_grant_entitlement ON it_grant IS 'Ensures grants reference valid entitlements';
COMMENT ON CONSTRAINT fk_it_sod_violation_rule ON it_sod_violation IS 'Ensures violations reference valid SoD rules';
COMMENT ON CONSTRAINT fk_uar_item_campaign ON uar_item IS 'Ensures UAR items belong to valid campaigns';
COMMENT ON CONSTRAINT fk_uar_pack_campaign ON uar_pack IS 'Ensures UAR packs belong to valid campaigns';
