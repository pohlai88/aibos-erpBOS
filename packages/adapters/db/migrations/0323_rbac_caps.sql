-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - RBAC Capabilities
-- Migration: 0323_rbac_caps.sql

-- Insert RBAC capabilities for sublease and SLB operations
INSERT INTO rbac_capability (id, name, description, module, created_at, created_by) VALUES
    ('lease:sublease', 'Manage Subleases', 'Create, modify, and manage sublease arrangements', 'lease', NOW(), 'system'),
    ('lease:slb', 'Manage Sale-and-Leaseback', 'Create, modify, and manage sale-and-leaseback transactions', 'lease', NOW(), 'system'),
    ('lease:lessor_post', 'Post Lessor Entries', 'Post journal entries for lessor operations (sublease income, SLB)', 'lease', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Grant default permissions to admin role
INSERT INTO rbac_role_capability (role_id, capability_id, created_at, created_by) 
SELECT 'admin', cap.id, NOW(), 'system'
FROM rbac_capability cap 
WHERE cap.id IN ('lease:sublease', 'lease:slb', 'lease:lessor_post')
ON CONFLICT (role_id, capability_id) DO NOTHING;
