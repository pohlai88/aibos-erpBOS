-- M15.2: Cash Alert Idempotency Table
-- Prevents duplicate alerts within a dedupe window

CREATE TABLE IF NOT EXISTS cash_alert_idempotency (
    key TEXT PRIMARY KEY,                    -- "cash_alerts:company_id:period:scenario_code"
    company_id TEXT NOT NULL,
    period TEXT NOT NULL,                    -- "2026-01" format
    scenario_code TEXT NOT NULL,
    breaches_count INTEGER NOT NULL DEFAULT 0,
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Query accelerators
CREATE INDEX IF NOT EXISTS cash_alert_idempotency_company_idx ON cash_alert_idempotency(company_id);
CREATE INDEX IF NOT EXISTS cash_alert_idempotency_period_idx ON cash_alert_idempotency(period);
CREATE INDEX IF NOT EXISTS cash_alert_idempotency_expires_idx ON cash_alert_idempotency(expires_at);

-- Add foreign key constraint
ALTER TABLE cash_alert_idempotency
    ADD CONSTRAINT fk_cash_alert_idempotency_company 
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
