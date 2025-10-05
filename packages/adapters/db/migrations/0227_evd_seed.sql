-- M26.4 Enhanced Evidence Vault - Seed Data
-- Migration: 0227_evd_seed.sql

-- Example seed: basic redaction rules for common PII patterns
INSERT INTO evd_redaction_rule (company_id, code, description, rule, updated_by) VALUES
  ('default', 'PII-BASIC', 'Basic PII redaction for bank account numbers and SSNs', 
   '{"mime": ["application/pdf", "text/csv", "application/json"], "patterns": [{"regex": "\\b\\d{12,16}\\b", "replacement": "[REDACTED-ACCOUNT]"}, {"regex": "\\b\\d{3}-\\d{2}-\\d{4}\\b", "replacement": "[REDACTED-SSN]"}]}', 
   'system'),
  ('default', 'PHI-BASIC', 'Basic PHI redaction for medical record numbers', 
   '{"mime": ["application/pdf", "text/csv"], "patterns": [{"regex": "\\bMRN-\\d{6,10}\\b", "replacement": "[REDACTED-MRN]"}]}', 
   'system'),
  ('default', 'EMAIL-REDACT', 'Email address redaction', 
   '{"mime": ["application/pdf", "text/csv", "text/plain"], "patterns": [{"regex": "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "replacement": "[REDACTED-EMAIL]"}]}', 
   'system')
ON CONFLICT (company_id, code) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE evd_redaction_rule IS 'Pre-configured redaction rules for common PII/PHI patterns';
