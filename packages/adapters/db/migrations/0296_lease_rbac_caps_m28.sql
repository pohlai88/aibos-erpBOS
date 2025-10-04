-- M28: Lease Accounting (MFRS 16) - RBAC Capabilities
-- Migration: 0296_lease_rbac_caps_m28.sql

-- Insert lease capabilities
INSERT INTO capability (id, company_id, code, name, description, created_at, created_by) VALUES
(gen_random_uuid()::text, 'system', 'lease:read', 'Lease Read', 'Read access to lease data and schedules', NOW(), 'system'),
(gen_random_uuid()::text, 'system', 'lease:manage', 'Lease Manage', 'Create, update, and modify lease contracts', NOW(), 'system'),
(gen_random_uuid()::text, 'system', 'lease:post', 'Lease Post', 'Post monthly lease journal entries', NOW(), 'system'),
(gen_random_uuid()::text, 'system', 'lease:disclose', 'Lease Disclose', 'Generate MFRS 16 disclosures and reports', NOW(), 'system');

-- Map capabilities to roles
INSERT INTO capability_role (id, capability_id, role, created_at, created_by) 
SELECT 
    gen_random_uuid()::text,
    c.id,
    r.role,
    NOW(),
    'system'
FROM capability c
CROSS JOIN (
    SELECT 'admin' as role
    UNION SELECT 'accountant'
    UNION SELECT 'controller'
    UNION SELECT 'auditor'
) r
WHERE c.code IN ('lease:read', 'lease:manage', 'lease:post', 'lease:disclose');

-- Grant read access to ops role
INSERT INTO capability_role (id, capability_id, role, created_at, created_by) 
SELECT 
    gen_random_uuid()::text,
    c.id,
    'ops',
    NOW(),
    'system'
FROM capability c
WHERE c.code = 'lease:read';

-- Comments for documentation
COMMENT ON TABLE capability IS 'Lease capabilities added for M28 MFRS 16 compliance';
COMMENT ON TABLE capability_role IS 'Role mappings for lease capabilities';
