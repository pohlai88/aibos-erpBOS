-- M26.9: ITGC & UAR Bridge - SoD Policy Engine
-- Migration: 0272_itgc_sod_policy.sql

-- Separation of Duties rules
CREATE TABLE it_sod_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  code TEXT NOT NULL,            -- e.g. SOD_AP_CREATE_APPROVE
  name TEXT NOT NULL,
  severity TEXT NOT NULL,        -- LOW|MEDIUM|HIGH|CRITICAL
  logic JSONB NOT NULL,          -- DSL: includes [entitlement_codes], [role_codes], any/all
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- SoD violations detected by the engine
CREATE TABLE it_sod_violation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  rule_id UUID NOT NULL REFERENCES it_sod_rule(id) ON DELETE CASCADE,
  system_id UUID NOT NULL,
  user_id UUID NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN|WAIVED|RESOLVED
  note TEXT,
  explanation JSONB,             -- which grants matched the rule
  UNIQUE(rule_id, user_id, detected_at)
);

-- Performance indexes
CREATE INDEX idx_it_sod_rule_company_active ON it_sod_rule(company_id, active);
CREATE INDEX idx_it_sod_rule_severity ON it_sod_rule(severity);

CREATE INDEX idx_it_sod_violation_company_status ON it_sod_violation(company_id, status);
CREATE INDEX idx_it_sod_violation_rule ON it_sod_violation(rule_id);
CREATE INDEX idx_it_sod_violation_user ON it_sod_violation(user_id);
CREATE INDEX idx_it_sod_violation_detected ON it_sod_violation(detected_at);

-- Comments for documentation
COMMENT ON TABLE it_sod_rule IS 'Separation of Duties rules for toxic combination detection';
COMMENT ON TABLE it_sod_violation IS 'SoD violations detected by the rule engine';
COMMENT ON COLUMN it_sod_rule.logic IS 'Rule logic in DSL format: {type: "allOf|anyOf", entitlements: [...], roles: [...]}';
COMMENT ON COLUMN it_sod_rule.severity IS 'Rule severity: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN it_sod_violation.status IS 'Violation status: OPEN, WAIVED, RESOLVED';
COMMENT ON COLUMN it_sod_violation.explanation IS 'Explanation of which grants matched the rule';
