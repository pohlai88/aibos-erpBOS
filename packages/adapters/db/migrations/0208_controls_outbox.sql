-- M26.1: Auto-Controls & Certifications - Outbox Events
-- Migration: 0208_controls_outbox.sql

-- Insert outbox event categories for controls and certifications
INSERT INTO outbox_category (id, name, description, retry_policy) VALUES
-- Control Events
('CTRL_FAIL', 'Control Failure', 'Control execution failed with exceptions', 'EXPONENTIAL'),
('CTRL_SLA_BREACH', 'Control SLA Breach', 'Control assignment exceeded SLA deadline', 'EXPONENTIAL'),
('CTRL_EXCEPTION', 'Control Exception', 'New exception found during control execution', 'EXPONENTIAL'),
('CTRL_WAIVED', 'Control Waived', 'Control failure was waived with justification', 'NONE'),

-- Certification Events
('CERT_SIGNED', 'Certification Signed', 'Certification statement was signed', 'NONE'),
('CERT_REQUIRED', 'Certification Required', 'Certification sign-off is required for close run', 'EXPONENTIAL'),

-- Exception Management Events
('EXCEPTION_RESOLVED', 'Exception Resolved', 'Control exception was resolved', 'NONE'),
('EXCEPTION_ESCALATED', 'Exception Escalated', 'Exception escalated due to aging', 'EXPONENTIAL'),

-- Evidence Events
('EVIDENCE_ADDED', 'Evidence Added', 'Evidence was attached to control run', 'NONE');

-- Comments for documentation
COMMENT ON TABLE outbox_category IS 'Outbox event categories for M26.1 Auto-Controls & Certifications';
