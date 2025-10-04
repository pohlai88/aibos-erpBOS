-- M26: RBAC Capabilities
-- New capabilities for close management, flux analysis, and MD&A

-- Add new capabilities to the existing capability system
-- These will be used in the RBAC system for authorization

-- Close Management Capabilities
INSERT INTO capability (name, description, category) VALUES
('close:manage', 'Manage close policies and configuration', 'close'),
('close:run', 'Execute close runs and manage tasks', 'close'),
('close:approve', 'Approve close tasks and evidence', 'close'),
('close:report', 'View close reports and KPIs', 'close'),
('flux:run', 'Execute flux analysis runs', 'flux'),
('mdna:edit', 'Edit MD&A templates and drafts', 'mdna'),
('mdna:approve', 'Approve MD&A drafts', 'mdna'),
('mdna:publish', 'Publish MD&A reports', 'mdna')
ON CONFLICT (name) DO NOTHING;

-- Update role capabilities (assuming roles table exists)
-- Admin gets all capabilities
INSERT INTO role_capability (role_id, capability_id)
SELECT r.id, c.id
FROM role r, capability c
WHERE r.name = 'admin' 
AND c.name IN ('close:manage', 'close:run', 'close:approve', 'close:report', 'flux:run', 'mdna:edit', 'mdna:approve', 'mdna:publish')
ON CONFLICT DO NOTHING;

-- Accountant gets most capabilities except manage
INSERT INTO role_capability (role_id, capability_id)
SELECT r.id, c.id
FROM role r, capability c
WHERE r.name = 'accountant' 
AND c.name IN ('close:run', 'close:approve', 'close:report', 'flux:run', 'mdna:edit', 'mdna:approve', 'mdna:publish')
ON CONFLICT DO NOTHING;

-- Ops gets limited capabilities
INSERT INTO role_capability (role_id, capability_id)
SELECT r.id, c.id
FROM role r, capability c
WHERE r.name = 'ops' 
AND c.name IN ('close:run', 'close:report', 'flux:run', 'mdna:edit')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE capability IS 'Updated with M26 close management capabilities';
COMMENT ON TABLE role_capability IS 'Updated with M26 role-capability mappings';
