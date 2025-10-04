-- M28.3: Componentized ROU & Impairment - RBAC Capabilities
-- Migration: 0304_rbac_caps.sql

-- Add new capabilities for M28.3
INSERT INTO rbac_capability (id, name, description, module, created_at) VALUES
('lease:component', 'Lease Component Management', 'Manage lease ROU components and schedules', 'lease', NOW()),
('lease:impair', 'Lease Impairment Testing', 'Perform impairment testing and posting', 'lease', NOW()),
('lease:disclose', 'Lease Disclosures', 'Generate lease disclosures and reports', 'lease', NOW());

-- Grant capabilities to admin role
INSERT INTO rbac_role_capability (role_id, capability_id, created_at)
SELECT r.id, c.id, NOW()
FROM rbac_role r, rbac_capability c
WHERE r.name = 'admin' 
AND c.name IN ('lease:component', 'lease:impair', 'lease:disclose');

-- Grant capabilities to accountant role
INSERT INTO rbac_role_capability (role_id, capability_id, created_at)
SELECT r.id, c.id, NOW()
FROM rbac_role r, rbac_capability c
WHERE r.name = 'accountant' 
AND c.name IN ('lease:component', 'lease:impair', 'lease:disclose');
