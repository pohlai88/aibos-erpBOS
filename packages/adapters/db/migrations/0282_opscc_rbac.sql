-- M27: Ops Command Center - RBAC Capabilities
-- Migration: 0282_opscc_rbac.sql

-- Insert OpsCC capabilities
INSERT INTO rbac_capability (capability, description, module) VALUES
('opscc:view', 'View Ops Command Center boards and KPIs', 'opscc'),
('opscc:admin', 'Manage Ops Command Center boards, tiles, and alerts', 'opscc'),
('opscc:playbook:execute', 'Execute playbook actions from alerts', 'opscc'),
('opscc:whatif:run', 'Run what-if simulations', 'opscc'),
('opscc:whatif:save', 'Save what-if scenarios', 'opscc');

-- Map capabilities to roles
INSERT INTO rbac_role_capability (role_id, capability)
SELECT r.id, 'opscc:view'
FROM rbac_role r
WHERE r.role IN ('admin', 'accountant', 'treasury_ops', 'finance_manager');

INSERT INTO rbac_role_capability (role_id, capability)
SELECT r.id, 'opscc:admin'
FROM rbac_role r
WHERE r.role IN ('admin', 'finance_manager');

INSERT INTO rbac_role_capability (role_id, capability)
SELECT r.id, 'opscc:playbook:execute'
FROM rbac_role r
WHERE r.role IN ('admin', 'treasury_ops', 'finance_manager');

INSERT INTO rbac_role_capability (role_id, capability)
SELECT r.id, 'opscc:whatif:run'
FROM rbac_role r
WHERE r.role IN ('admin', 'accountant', 'treasury_ops', 'finance_manager');

INSERT INTO rbac_role_capability (role_id, capability)
SELECT r.id, 'opscc:whatif:save'
FROM rbac_role r
WHERE r.role IN ('admin', 'finance_manager');

-- Comments for documentation
COMMENT ON TABLE rbac_capability IS 'Added OpsCC capabilities: view, admin, playbook execution, what-if simulations';
