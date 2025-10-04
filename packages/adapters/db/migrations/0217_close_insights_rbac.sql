-- M26.2: Close Insights & Benchmarks - RBAC Capabilities
-- Migration: 0217_close_insights_rbac.sql

-- Add insights-specific RBAC capabilities
INSERT INTO rbac_capability (id, name, description, created_at) VALUES
('insights:view', 'View Insights', 'View insights, benchmarks, and analytics', NOW()),
('insights:admin', 'Admin Insights', 'Manage insights data, targets, and recommendations', NOW())
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE rbac_capability IS 'Added insights-specific RBAC capabilities for access control';
