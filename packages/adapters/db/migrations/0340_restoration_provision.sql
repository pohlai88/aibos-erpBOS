-- M28.7: Lease Derecognition - Restoration Provisions (IAS 37)
-- Migration: 0340_restoration_provision.sql

-- lease_restoration — restoration provisions tracking (IAS 37)
CREATE TABLE lease_restoration (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- nullable for lease-level provisions
    as_of_date DATE NOT NULL,
    estimate NUMERIC(18,2) NOT NULL, -- estimated restoration cost
    discount_rate NUMERIC(10,6) NOT NULL, -- discount rate for present value calculation
    opening NUMERIC(18,2) NOT NULL DEFAULT 0, -- opening provision balance
    charge NUMERIC(18,2) NOT NULL DEFAULT 0, -- provision charged during period
    unwind NUMERIC(18,2) NOT NULL DEFAULT 0, -- unwind of discount during period
    utilization NUMERIC(18,2) NOT NULL DEFAULT 0, -- provision utilized during period
    closing NUMERIC(18,2) NOT NULL DEFAULT 0, -- closing provision balance
    posted BOOLEAN NOT NULL DEFAULT false, -- whether provision has been posted
    notes JSONB, -- calculation details and assumptions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    UNIQUE(lease_id, component_id, as_of_date)
);

-- Indexes for performance
CREATE INDEX idx_lease_restoration_lease ON lease_restoration(lease_id);
CREATE INDEX idx_lease_restoration_component ON lease_restoration(component_id);
CREATE INDEX idx_lease_restoration_date ON lease_restoration(as_of_date);
CREATE INDEX idx_lease_restoration_posted ON lease_restoration(posted);

-- Comments for documentation
COMMENT ON TABLE lease_restoration IS 'Restoration provisions tracking per IAS 37 requirements';
COMMENT ON COLUMN lease_restoration.estimate IS 'Estimated restoration cost at as_of_date';
COMMENT ON COLUMN lease_restoration.discount_rate IS 'Discount rate used for present value calculation';
COMMENT ON COLUMN lease_restoration.opening IS 'Opening provision balance for the period';
COMMENT ON COLUMN lease_restoration.charge IS 'Provision charged during the period';
COMMENT ON COLUMN lease_restoration.unwind IS 'Unwind of discount (finance cost) during the period';
COMMENT ON COLUMN lease_restoration.utilization IS 'Provision utilized (actual restoration costs) during the period';
COMMENT ON COLUMN lease_restoration.closing IS 'Closing provision balance for the period';
COMMENT ON COLUMN lease_restoration.posted IS 'Whether the provision movement has been posted to GL';
