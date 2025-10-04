-- M27.2: RBAC capabilities for Playbook Studio
-- Required capabilities for visual editor, versioning, and guarded autonomy

-- Playbook Studio capabilities
INSERT INTO rbac_capability (capability, description, category) VALUES
('ops:playbook:create', 'Create new playbooks', 'OPSCC'),
('ops:playbook:edit', 'Edit existing playbooks', 'OPSCC'),
('ops:playbook:version', 'Create and manage playbook versions', 'OPSCC'),
('ops:playbook:dryrun', 'Execute dry-run sandbox tests', 'OPSCC'),
('ops:playbook:approve', 'Approve playbook executions', 'OPSCC'),
('ops:playbook:canary', 'Execute canary mode deployments', 'OPSCC'),
('ops:playbook:rollback', 'Trigger rollback operations', 'OPSCC'),
('ops:rule:create', 'Create new rules', 'OPSCC'),
('ops:rule:edit', 'Edit existing rules', 'OPSCC'),
('ops:rule:version', 'Create and manage rule versions', 'OPSCC'),
('ops:rule:test', 'Test rules against historical data', 'OPSCC'),
('ops:blast:view', 'View blast radius information', 'OPSCC'),
('ops:blast:configure', 'Configure blast radius limits', 'OPSCC'),
('ops:metrics:view', 'View execution metrics and analytics', 'OPSCC'),
('ops:verification:view', 'View action verification results', 'OPSCC'),
('ops:verification:configure', 'Configure verification rules', 'OPSCC');

-- Role assignments for common roles
INSERT INTO rbac_role_capability (role_id, capability) 
SELECT r.id, c.id
FROM rbac_role r, rbac_capability c
WHERE r.name = 'Admin' 
AND c.capability IN (
    'ops:playbook:create', 'ops:playbook:edit', 'ops:playbook:version',
    'ops:playbook:dryrun', 'ops:playbook:approve', 'ops:playbook:canary',
    'ops:playbook:rollback', 'ops:rule:create', 'ops:rule:edit',
    'ops:rule:version', 'ops:rule:test', 'ops:blast:view',
    'ops:blast:configure', 'ops:metrics:view', 'ops:verification:view',
    'ops:verification:configure'
);

INSERT INTO rbac_role_capability (role_id, capability) 
SELECT r.id, c.id
FROM rbac_role r, rbac_capability c
WHERE r.name = 'Ops Manager' 
AND c.capability IN (
    'ops:playbook:create', 'ops:playbook:edit', 'ops:playbook:version',
    'ops:playbook:dryrun', 'ops:playbook:approve', 'ops:playbook:canary',
    'ops:rule:create', 'ops:rule:edit', 'ops:rule:version', 'ops:rule:test',
    'ops:blast:view', 'ops:blast:configure', 'ops:metrics:view',
    'ops:verification:view'
);

INSERT INTO rbac_role_capability (role_id, capability) 
SELECT r.id, c.id
FROM rbac_role r, rbac_capability c
WHERE r.name = 'Ops Analyst' 
AND c.capability IN (
    'ops:playbook:dryrun', 'ops:rule:test', 'ops:blast:view',
    'ops:metrics:view', 'ops:verification:view'
);

-- Comments
COMMENT ON TABLE rbac_capability IS 'Extended with M27.2 Playbook Studio capabilities';
COMMENT ON TABLE rbac_role_capability IS 'Extended with M27.2 role assignments';
