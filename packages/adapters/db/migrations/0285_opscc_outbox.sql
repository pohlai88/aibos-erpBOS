-- M27: Ops Command Center - Outbox Events
-- Migration: 0285_opscc_outbox.sql

-- Outbox table for OpsCC events
CREATE TABLE opscc_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING',
  error_message TEXT,
  next_retry_at TIMESTAMPTZ
);

-- Performance indexes for outbox
CREATE INDEX idx_opscc_outbox_company ON opscc_outbox(company_id);
CREATE INDEX idx_opscc_outbox_status ON opscc_outbox(status);
CREATE INDEX idx_opscc_outbox_created_at ON opscc_outbox(created_at);
CREATE INDEX idx_opscc_outbox_next_retry ON opscc_outbox(next_retry_at) WHERE status = 'PENDING';

-- Comments for documentation
COMMENT ON TABLE opscc_outbox IS 'Outbox pattern for OpsCC events (alerts, notifications, webhooks)';
COMMENT ON COLUMN opscc_outbox.event_type IS 'Event type: ALERT_FIRED, PLAYBOOK_EXECUTED, WHATIF_RUN, etc.';
COMMENT ON COLUMN opscc_outbox.event_data IS 'Event payload as JSON';
COMMENT ON COLUMN opscc_outbox.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN opscc_outbox.max_retries IS 'Maximum retry attempts before marking as failed';
COMMENT ON COLUMN opscc_outbox.next_retry_at IS 'Next retry timestamp for exponential backoff';
