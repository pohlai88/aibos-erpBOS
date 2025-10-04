-- M26.5: SOX 302/404 Pack - RBAC Capabilities
-- SOX-specific permissions

INSERT INTO rbac_capability (id, capability, description) VALUES
('sox-admin', 'sox:admin', 'Administer SOX controls, scope, and policies'),
('sox-test-plan', 'sox:test.plan', 'Create and approve test plans'),
('sox-test-exec', 'sox:test.exec', 'Execute tests and record results'),
('sox-deficiency', 'sox:deficiency', 'Manage deficiencies and remediation'),
('sox-assert', 'sox:assert', 'Create and sign management assertions');

-- Update role capabilities
UPDATE membership SET scopes = array_append(scopes, 'sox:admin') WHERE role = 'admin';
UPDATE membership SET scopes = array_append(scopes, 'sox:test.plan') WHERE role = 'admin';
UPDATE membership SET scopes = array_append(scopes, 'sox:test.exec') WHERE role = 'admin';
UPDATE membership SET scopes = array_append(scopes, 'sox:deficiency') WHERE role = 'admin';
UPDATE membership SET scopes = array_append(scopes, 'sox:assert') WHERE role = 'admin';

UPDATE membership SET scopes = array_append(scopes, 'sox:test.plan') WHERE role = 'accountant';
UPDATE membership SET scopes = array_append(scopes, 'sox:test.exec') WHERE role = 'accountant';
UPDATE membership SET scopes = array_append(scopes, 'sox:deficiency') WHERE role = 'accountant';
UPDATE membership SET scopes = array_append(scopes, 'sox:assert') WHERE role = 'accountant';

UPDATE membership SET scopes = array_append(scopes, 'sox:test.exec') WHERE role = 'ops';
UPDATE membership SET scopes = array_append(scopes, 'sox:deficiency') WHERE role = 'ops';
