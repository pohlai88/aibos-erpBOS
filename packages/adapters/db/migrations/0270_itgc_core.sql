-- M26.9: ITGC & UAR Bridge - Core Tables
-- Migration: 0270_itgc_core.sql

-- IT Systems registry
CREATE TABLE it_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,            -- e.g. "ERP", "DB-PROD", "OKTA"
  name TEXT NOT NULL,
  kind TEXT NOT NULL,            -- ERP|DB|CLOUD|BI|APP
  owner_user_id TEXT NOT NULL,   -- internal owner
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Connector profiles for data ingestion
CREATE TABLE it_connector_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL REFERENCES it_system(id) ON DELETE CASCADE,
  connector TEXT NOT NULL,       -- SCIM|SAML|OIDC|SQL|CSV|API
  settings JSONB NOT NULL,       -- endpoint, table, query, mapping
  secret_ref UUID,               -- reuse 0106 secret_ref
  schedule_cron TEXT,            -- e.g. '0 2 * * *'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_it_system_company_active ON it_system(company_id, is_active);
CREATE INDEX idx_it_connector_profile_system ON it_connector_profile(system_id);
CREATE INDEX idx_it_connector_profile_schedule ON it_connector_profile(schedule_cron) WHERE is_enabled = true;

-- Comments for documentation
COMMENT ON TABLE it_system IS 'Registry of IT systems in scope for ITGC';
COMMENT ON TABLE it_connector_profile IS 'Configuration for automated data ingestion from IT systems';
COMMENT ON COLUMN it_system.kind IS 'System type: ERP, DB, CLOUD, BI, APP';
COMMENT ON COLUMN it_connector_profile.connector IS 'Ingestion method: SCIM, SAML, OIDC, SQL, CSV, API';
COMMENT ON COLUMN it_connector_profile.settings IS 'Connector-specific configuration (endpoints, mappings, etc.)';
