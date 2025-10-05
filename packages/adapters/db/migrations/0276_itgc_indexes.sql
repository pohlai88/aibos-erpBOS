-- M26.9: ITGC & UAR Bridge - Performance Indexes
-- Migration: 0276_itgc_indexes.sql

-- Additional performance indexes for complex queries

-- Composite indexes for common query patterns
CREATE INDEX idx_it_user_company_system_status ON it_user(company_id, system_id, status);
CREATE INDEX idx_it_user_email ON it_user(email) WHERE email IS NOT NULL;

CREATE INDEX idx_it_grant_company_user_expires ON it_grant(company_id, user_id, expires_at);
CREATE INDEX idx_it_grant_company_entitlement ON it_grant(company_id, entitlement_id);
CREATE INDEX idx_it_grant_source_created ON it_grant(source, created_at);

CREATE INDEX idx_it_sod_violation_company_rule_status ON it_sod_violation(company_id, rule_id, status);
CREATE INDEX idx_it_sod_violation_user_status ON it_sod_violation(user_id, status);

CREATE INDEX idx_uar_item_campaign_owner_state ON uar_item(campaign_id, owner_user_id, state);
CREATE INDEX idx_uar_item_company_state ON uar_item(company_id, state);

CREATE INDEX idx_it_breakglass_company_expires ON it_breakglass(company_id, expires_at) WHERE closed_at IS NULL;

-- Partial indexes for active records
CREATE INDEX idx_it_system_active ON it_system(company_id, code) WHERE is_active = true;
CREATE INDEX idx_it_connector_profile_active ON it_connector_profile(system_id, connector) WHERE is_enabled = true;
CREATE INDEX idx_it_sod_rule_active ON it_sod_rule(company_id, code) WHERE active = true;

-- Time-based indexes for reporting
CREATE INDEX idx_it_grant_granted_at ON it_grant(granted_at);
CREATE INDEX idx_it_user_first_seen ON it_user(first_seen);
CREATE INDEX idx_it_user_last_seen ON it_user(last_seen);

-- Comments for documentation
COMMENT ON INDEX idx_it_user_company_system_status IS 'Optimizes queries filtering users by company, system, and status';
COMMENT ON INDEX idx_it_grant_company_user_expires IS 'Optimizes queries for user grants with expiration filtering';
COMMENT ON INDEX idx_it_sod_violation_company_rule_status IS 'Optimizes SoD violation queries by company, rule, and status';
COMMENT ON INDEX idx_uar_item_campaign_owner_state IS 'Optimizes UAR item queries by campaign, owner, and state';
