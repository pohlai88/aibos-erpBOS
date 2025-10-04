-- M26.9: ITGC & UAR Bridge - RBAC Capabilities
-- Migration: 0277_itgc_rbac_caps.sql

-- Insert ITGC-specific RBAC capabilities
INSERT INTO rbac_capability (id, code, name, description, module) VALUES
-- ITGC Admin capabilities
('itgc:admin', 'itgc:admin', 'ITGC Administration', 'Full administrative access to ITGC systems, connectors, and policies', 'itgc'),
('itgc:ingest', 'itgc:ingest', 'ITGC Data Ingestion', 'Ability to run manual data ingestion jobs', 'itgc'),
('itgc:campaigns', 'itgc:campaigns', 'UAR Campaign Management', 'Create, open, close UAR campaigns and make certification decisions', 'itgc'),
('itgc:breakglass', 'itgc:breakglass', 'Break-glass Access', 'Open and close emergency access grants', 'itgc'),
('itgc:view', 'itgc:view', 'ITGC View Access', 'View ITGC reports, violations, and system information', 'itgc')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module;

-- Comments for documentation
COMMENT ON TABLE rbac_capability IS 'ITGC capabilities: admin, ingest, campaigns, breakglass, view';
COMMENT ON CAPABILITY 'itgc:admin' IS 'Full administrative access to ITGC systems, connectors, and policies';
COMMENT ON CAPABILITY 'itgc:ingest' IS 'Ability to run manual data ingestion jobs';
COMMENT ON CAPABILITY 'itgc:campaigns' IS 'Create, open, close UAR campaigns and make certification decisions';
COMMENT ON CAPABILITY 'itgc:breakglass' IS 'Open and close emergency access grants';
COMMENT ON CAPABILITY 'itgc:view' IS 'View ITGC reports, violations, and system information';
