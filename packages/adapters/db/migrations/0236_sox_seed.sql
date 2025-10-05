-- M26.5: SOX 302/404 Pack - Seed Data
-- Example controls and quarterly scope

-- Example key controls for common processes
INSERT INTO sox_key_control (company_id, code, name, process, risk_stmt, assertion, frequency, automation, owner_id, created_by) VALUES
('test-company-123', 'JE-01', 'Journal Entry Approval', 'R2R', 'Unauthorized journal entries could result in material misstatements', 'E/O', 'MONTHLY', 'IT_DEP', 'test-user-123', 'test-user-123'),
('test-company-123', 'JE-02', 'Journal Entry Review', 'R2R', 'Incorrect journal entries may not be detected', 'E/O', 'MONTHLY', 'MANUAL', 'test-user-123', 'test-user-123'),
('test-company-123', 'AR-01', 'Revenue Recognition', 'O2C', 'Revenue may be recognized prematurely or incorrectly', 'E/O', 'MONTHLY', 'IT_DEP', 'test-user-123', 'test-user-123'),
('test-company-123', 'AP-01', 'Vendor Invoice Approval', 'P2P', 'Unauthorized or duplicate payments may be made', 'E/O', 'WEEKLY', 'MANUAL', 'test-user-123', 'test-user-123'),
('test-company-123', 'IT-01', 'User Access Review', 'ITGC', 'Inappropriate system access may not be detected', 'C/O', 'QUARTERLY', 'IT_DEP', 'test-user-123', 'test-user-123');

-- Example quarterly scope for 2025
INSERT INTO sox_control_scope (company_id, control_id, period, in_scope, materiality, updated_by) 
SELECT 
  'test-company-123',
  id,
  '2025Q1',
  true,
  10000.00,
  'test-user-123'
FROM sox_key_control 
WHERE company_id = 'test-company-123';

INSERT INTO sox_control_scope (company_id, control_id, period, in_scope, materiality, updated_by) 
SELECT 
  'test-company-123',
  id,
  '2025Q2',
  true,
  10000.00,
  'test-user-123'
FROM sox_key_control 
WHERE company_id = 'test-company-123';

INSERT INTO sox_control_scope (company_id, control_id, period, in_scope, materiality, updated_by) 
SELECT 
  'test-company-123',
  id,
  '2025Q3',
  true,
  10000.00,
  'test-user-123'
FROM sox_key_control 
WHERE company_id = 'test-company-123';

INSERT INTO sox_control_scope (company_id, control_id, period, in_scope, materiality, updated_by) 
SELECT 
  'test-company-123',
  id,
  '2025Q4',
  true,
  10000.00,
  'test-user-123'
FROM sox_key_control 
WHERE company_id = 'test-company-123';
