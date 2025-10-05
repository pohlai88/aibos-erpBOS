-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - RBAC Capabilities
-- Migration: 0334_rbac_caps.sql

-- Insert RBAC capabilities for impairment and onerous functionality
INSERT INTO rbac_capability (id, company_id, capability_name, description, module, created_at, created_by) VALUES
    ('lease:impair:test', 'default', 'lease:impair:test', 'Create and manage lease impairment tests', 'lease', NOW(), 'system'),
    ('lease:impair:post', 'default', 'lease:impair:post', 'Post impairment journal entries', 'lease', NOW(), 'system'),
    ('lease:onerous', 'default', 'lease:onerous', 'Manage onerous contract assessments and provisions', 'lease', NOW(), 'system'),
    ('lease:disclose', 'default', 'lease:disclose', 'View lease disclosures including impairment and onerous data', 'lease', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Grant default permissions to authenticated users
INSERT INTO rbac_permission (id, company_id, role_id, capability_id, granted_at, granted_by) 
SELECT 
    gen_random_uuid()::text,
    'default',
    r.id,
    c.id,
    NOW(),
    'system'
FROM rbac_role r
CROSS JOIN rbac_capability c
WHERE r.role_name IN ('lease_manager', 'lease_analyst', 'finance_manager')
  AND c.capability_name IN ('lease:impair:test', 'lease:impair:post', 'lease:onerous', 'lease:disclose')
ON CONFLICT DO NOTHING;
