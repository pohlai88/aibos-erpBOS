-- M27.1: Real-Time Signals & Auto-Playbooks - RBAC Capabilities
-- Migration: 0286_ops_rbac_caps.sql

-- Insert RBAC capabilities for OpsCC signals and playbooks
INSERT INTO rbac_capability (code, name, description, module) VALUES
('ops:signals:ingest', 'Ingest Signals', 'Ingest real-time signals into OpsCC', 'OPSCC'),
('ops:rules:admin', 'Manage Rules', 'Create, update, and delete OpsCC rules', 'OPSCC'),
('ops:playbooks:admin', 'Manage Playbooks', 'Create, update, and delete action playbooks', 'OPSCC'),
('ops:actions:execute', 'Execute Actions', 'Execute playbook actions and steps', 'OPSCC'),
('ops:fires:approve', 'Approve Fires', 'Approve or reject rule firing executions', 'OPSCC'),
('ops:observability:read', 'View Observability', 'View OpsCC health, metrics, and execution logs', 'OPSCC')
ON CONFLICT (code) DO NOTHING;

-- Assign capabilities to roles
-- Admin role gets all OpsCC capabilities
INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:signals:ingest'
FROM rbac_role r 
WHERE r.code = 'admin'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:rules:admin'
FROM rbac_role r 
WHERE r.code = 'admin'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:playbooks:admin'
FROM rbac_role r 
WHERE r.code = 'admin'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:actions:execute'
FROM rbac_role r 
WHERE r.code = 'admin'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:fires:approve'
FROM rbac_role r 
WHERE r.code = 'admin'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:observability:read'
FROM rbac_role r 
WHERE r.code = 'admin'
ON CONFLICT (role_id, capability_code) DO NOTHING;

-- Ops role gets execution and approval capabilities
INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:actions:execute'
FROM rbac_role r 
WHERE r.code = 'ops'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:fires:approve'
FROM rbac_role r 
WHERE r.code = 'ops'
ON CONFLICT (role_id, capability_code) DO NOTHING;

INSERT INTO rbac_role_capability (role_id, capability_code)
SELECT r.id, 'ops:observability:read'
FROM rbac_role r 
WHERE r.code = 'ops'
ON CONFLICT (role_id, capability_code) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE rbac_capability IS 'Added OpsCC capabilities: signals:ingest, rules:admin, playbooks:admin, actions:execute, fires:approve, observability:read';
