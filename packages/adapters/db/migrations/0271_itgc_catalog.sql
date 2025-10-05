-- M26.9: ITGC & UAR Bridge - Catalog Tables
-- Migration: 0271_itgc_catalog.sql

-- IT Users from connected systems
CREATE TABLE it_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL REFERENCES it_system(id) ON DELETE CASCADE,
  ext_id TEXT NOT NULL,          -- system user id
  email CITEXT, 
  display_name TEXT,
  status TEXT NOT NULL,          -- ACTIVE|DISABLED|LOCKED|TERMINATED
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, system_id, ext_id)
);

-- IT Roles/Groups from connected systems
CREATE TABLE it_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL REFERENCES it_system(id) ON DELETE CASCADE,
  code TEXT NOT NULL,            -- e.g. ROLE_AP_ADMIN
  name TEXT NOT NULL,
  critical BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(company_id, system_id, code)
);

-- Entitlements (roles, groups, privileges, schemas, tables, actions)
CREATE TABLE it_entitlement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL REFERENCES it_system(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,            -- ROLE|GROUP|PRIV|SCHEMA|TABLE|ACTION
  code TEXT NOT NULL,
  name TEXT,
  UNIQUE(company_id, system_id, kind, code)
);

-- User grants (assignments of entitlements to users)
CREATE TABLE it_grant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL REFERENCES it_system(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES it_user(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES it_entitlement(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL,          -- HR|JOINER|TICKET|EMERGENCY|MANUAL
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, system_id, user_id, entitlement_id)
);

-- Performance indexes
CREATE INDEX idx_it_user_company_system ON it_user(company_id, system_id);
CREATE INDEX idx_it_user_status ON it_user(status) WHERE status != 'ACTIVE';
CREATE INDEX idx_it_user_last_seen ON it_user(last_seen);

CREATE INDEX idx_it_role_company_system ON it_role(company_id, system_id);
CREATE INDEX idx_it_role_critical ON it_role(critical) WHERE critical = true;

CREATE INDEX idx_it_entitlement_company_system ON it_entitlement(company_id, system_id);
CREATE INDEX idx_it_entitlement_kind ON it_entitlement(kind);

CREATE INDEX idx_it_grant_company_system ON it_grant(company_id, system_id);
CREATE INDEX idx_it_grant_user ON it_grant(user_id);
CREATE INDEX idx_it_grant_entitlement ON it_grant(entitlement_id);
CREATE INDEX idx_it_grant_expires ON it_grant(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_it_grant_source ON it_grant(source);

-- Comments for documentation
COMMENT ON TABLE it_user IS 'Users from connected IT systems';
COMMENT ON TABLE it_role IS 'Roles/Groups from connected IT systems';
COMMENT ON TABLE it_entitlement IS 'Entitlements (roles, groups, privileges, schemas, tables, actions)';
COMMENT ON TABLE it_grant IS 'User grants (assignments of entitlements to users)';
COMMENT ON COLUMN it_user.ext_id IS 'External system user identifier';
COMMENT ON COLUMN it_user.status IS 'User status: ACTIVE, DISABLED, LOCKED, TERMINATED';
COMMENT ON COLUMN it_role.critical IS 'Whether this role is considered critical for SoD analysis';
COMMENT ON COLUMN it_entitlement.kind IS 'Entitlement type: ROLE, GROUP, PRIV, SCHEMA, TABLE, ACTION';
COMMENT ON COLUMN it_grant.source IS 'Grant source: HR, JOINER, TICKET, EMERGENCY, MANUAL';
