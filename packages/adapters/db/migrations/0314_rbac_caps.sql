-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0314_rbac_caps.sql

-- Add RBAC capabilities for M28.4
INSERT INTO rbac_capability (id, name, description, module, created_at, created_by) VALUES
('lease:modify', 'Lease Modify', 'Create and manage lease modifications', 'lease', NOW(), 'system'),
('lease:index', 'Lease Index', 'Manage lease indexation and CPI values', 'lease', NOW(), 'system'),
('lease:concession', 'Lease Concession', 'Manage lease concessions and rent holidays', 'lease', NOW(), 'system'),
('lease:remeasure', 'Lease Remeasure', 'Apply lease remeasurements and postings', 'lease', NOW(), 'system'),
('lease:disclose', 'Lease Disclose', 'Generate lease disclosures and reports', 'lease', NOW(), 'system');

-- Grant default capabilities to admin role
INSERT INTO rbac_role_capability (role_id, capability_id, created_at, created_by)
SELECT r.id, c.id, NOW(), 'system'
FROM rbac_role r, rbac_capability c
WHERE r.name = 'admin' 
AND c.name IN ('lease:modify', 'lease:index', 'lease:concession', 'lease:remeasure', 'lease:disclose');
