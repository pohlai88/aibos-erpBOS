-- M26.9: ITGC & UAR Bridge - Break-glass Access
-- Migration: 0274_itgc_breakglass.sql

-- Break-glass emergency access records
CREATE TABLE it_breakglass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  system_id UUID NOT NULL,
  user_id UUID NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ticket TEXT NOT NULL,
  reason TEXT NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  UNIQUE(company_id, system_id, user_id, opened_at)
);

-- Performance indexes
CREATE INDEX idx_it_breakglass_company_status ON it_breakglass(company_id, closed_at) WHERE closed_at IS NULL;
CREATE INDEX idx_it_breakglass_expires ON it_breakglass(expires_at) WHERE closed_at IS NULL;
CREATE INDEX idx_it_breakglass_user ON it_breakglass(user_id);
CREATE INDEX idx_it_breakglass_system ON it_breakglass(system_id);
CREATE INDEX idx_it_breakglass_opened ON it_breakglass(opened_at);

-- Comments for documentation
COMMENT ON TABLE it_breakglass IS 'Break-glass emergency access records with time-bound grants';
COMMENT ON COLUMN it_breakglass.ticket IS 'Ticket number or reference for the emergency access';
COMMENT ON COLUMN it_breakglass.reason IS 'Business justification for emergency access';
COMMENT ON COLUMN it_breakglass.closed_at IS 'When the emergency access was closed (NULL = active)';
