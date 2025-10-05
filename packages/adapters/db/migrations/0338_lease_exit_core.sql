-- M28.7: Lease Derecognition, Early Termination & Surrenders - Core Tables
-- Migration: 0338_lease_exit_core.sql

-- lease_exit — exit events (full/partial termination, buyout, expiry)
CREATE TABLE lease_exit (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- nullable for lease-level exits
    event_date DATE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('FULL', 'PARTIAL', 'BUYOUT', 'EXPIRY')),
    reason TEXT NOT NULL,
    settlement NUMERIC(18,2) NOT NULL DEFAULT 0, -- settlement payment amount
    penalty NUMERIC(18,2) NOT NULL DEFAULT 0, -- penalty/fee amount
    restoration NUMERIC(18,2) NOT NULL DEFAULT 0, -- restoration cost estimate
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'POSTED')) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- lease_exit_calc — derecognition calculations per component
CREATE TABLE lease_exit_calc (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exit_id TEXT NOT NULL REFERENCES lease_exit(id) ON DELETE CASCADE,
    carrying_rou NUMERIC(18,2) NOT NULL, -- ROU carrying amount at exit
    carrying_liab NUMERIC(18,2) NOT NULL, -- lease liability carrying amount at exit
    share_pct NUMERIC(7,4) NOT NULL DEFAULT 100.0000, -- percentage share for partial exits
    derecog_rou NUMERIC(18,2) NOT NULL, -- ROU amount derecognized
    derecog_liab NUMERIC(18,2) NOT NULL, -- liability amount derecognized
    gain_loss NUMERIC(18,2) NOT NULL DEFAULT 0, -- gain/loss on derecognition
    notes JSONB, -- calculation details and assumptions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- lease_exit_fx — FX handling for exits
CREATE TABLE lease_exit_fx (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exit_id TEXT NOT NULL REFERENCES lease_exit(id) ON DELETE CASCADE,
    rate_src TEXT NOT NULL, -- source of FX rate (CLOSE, AVG, HIST)
    present_ccy TEXT NOT NULL CHECK (length(present_ccy) = 3),
    spot NUMERIC(12,6) NOT NULL, -- spot rate used
    policy TEXT NOT NULL CHECK (policy IN ('CLOSE', 'AVG', 'HIST')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lease_exit_company_date ON lease_exit(company_id, event_date);
CREATE INDEX idx_lease_exit_lease ON lease_exit(lease_id);
CREATE INDEX idx_lease_exit_component ON lease_exit(component_id);
CREATE INDEX idx_lease_exit_status ON lease_exit(status);
CREATE INDEX idx_lease_exit_calc_exit ON lease_exit_calc(exit_id);
CREATE INDEX idx_lease_exit_fx_exit ON lease_exit_fx(exit_id);

-- Comments for documentation
COMMENT ON TABLE lease_exit IS 'Lease exit events: termination, surrender, buyout, expiry';
COMMENT ON COLUMN lease_exit.kind IS 'Type of exit: FULL (complete termination), PARTIAL (area/payment reduction), BUYOUT (purchase option), EXPIRY (normal end)';
COMMENT ON COLUMN lease_exit.settlement IS 'Settlement payment amount (positive = payment to lessor, negative = receipt from lessor)';
COMMENT ON COLUMN lease_exit.penalty IS 'Penalty or fee amount for early termination';
COMMENT ON COLUMN lease_exit.restoration IS 'Estimated restoration cost at exit date';

COMMENT ON TABLE lease_exit_calc IS 'Derecognition calculations for each exit event';
COMMENT ON COLUMN lease_exit_calc.share_pct IS 'Percentage share for partial exits (0.0000 to 100.0000)';
COMMENT ON COLUMN lease_exit_calc.gain_loss IS 'Gain (positive) or loss (negative) on derecognition';

COMMENT ON TABLE lease_exit_fx IS 'Foreign exchange rate information for exit calculations';
COMMENT ON COLUMN lease_exit_fx.rate_src IS 'Source of FX rate: CLOSE (closing rate), AVG (average rate), HIST (historical rate)';
