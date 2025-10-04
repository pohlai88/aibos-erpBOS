-- M26.1: Auto-Controls & Certifications - RBAC Capabilities
-- Migration: 0206_controls_rbac.sql

-- Insert RBAC capabilities for controls and certifications
INSERT INTO rbac_capability (id, name, description, category) VALUES
-- Controls Management
('ctrl:manage', 'Manage Controls', 'Create, update, and delete control definitions', 'CONTROLS'),
('ctrl:assign', 'Assign Controls', 'Assign controls to close runs, tasks, or entities', 'CONTROLS'),
('ctrl:run', 'Run Controls', 'Execute control runs and view results', 'CONTROLS'),
('ctrl:approve', 'Approve Controls', 'Approve control results and waive failures', 'CONTROLS'),
('ctrl:waive', 'Waive Controls', 'Waive control failures with justification', 'CONTROLS'),

-- Certifications
('cert:sign', 'Sign Certifications', 'Sign certification statements for close runs', 'CERTIFICATIONS'),
('cert:manage', 'Manage Certifications', 'Create and manage certification statement templates', 'CERTIFICATIONS'),

-- Evidence Management
('ctrl:evidence', 'Manage Evidence', 'Attach and manage control evidence', 'CONTROLS'),

-- Exception Management
('ctrl:exceptions', 'Manage Exceptions', 'View and manage control exceptions', 'CONTROLS'),
('ctrl:remediate', 'Remediate Exceptions', 'Resolve and remediate control exceptions', 'CONTROLS'),

-- Reporting
('ctrl:report', 'Control Reports', 'View control status and exception reports', 'CONTROLS'),
('cert:report', 'Certification Reports', 'View certification status and sign-off reports', 'CERTIFICATIONS');

-- Comments for documentation
COMMENT ON TABLE rbac_capability IS 'RBAC capabilities for M26.1 Auto-Controls & Certifications';
