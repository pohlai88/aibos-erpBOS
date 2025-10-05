-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - Onerous Contracts Core
-- Migration: 0331_onerous_core.sql

-- Onerous contract assessments (IAS 37)
CREATE TABLE onerous_assessment (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    as_of_date DATE NOT NULL,
    lease_component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- null for non-lease service components
    service_item TEXT NOT NULL, -- description of service component (e.g., 'CAM fees', 'maintenance')
    term_months INTEGER NOT NULL, -- remaining term in months
    unavoidable_cost NUMERIC(18,2) NOT NULL, -- unavoidable costs to fulfill contract
    expected_benefit NUMERIC(18,2) NOT NULL, -- expected economic benefits
    provision NUMERIC(18,2) NOT NULL DEFAULT 0, -- provision amount (unavoidable_cost - expected_benefit)
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'RECOGNIZED', 'RELEASED')) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Monthly roll-forward for onerous provisions
CREATE TABLE onerous_roll (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assessment_id TEXT NOT NULL REFERENCES onerous_assessment(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    opening NUMERIC(18,2) NOT NULL DEFAULT 0, -- opening provision balance
    charge NUMERIC(18,2) NOT NULL DEFAULT 0, -- new provision recognized
    unwind NUMERIC(18,2) NOT NULL DEFAULT 0, -- discount accretion/unwind
    utilization NUMERIC(18,2) NOT NULL DEFAULT 0, -- provision utilized/settled
    closing NUMERIC(18,2) NOT NULL DEFAULT 0, -- closing provision balance
    posted BOOLEAN NOT NULL DEFAULT false, -- whether JE has been posted
    notes JSONB, -- additional notes/metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    UNIQUE(assessment_id, year, month)
);

-- Posting lock for idempotent journal entry posting
CREATE TABLE onerous_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL REFERENCES onerous_assessment(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    journal_id TEXT, -- reference to posted journal
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_id, year, month)
);

-- Add indexes for performance
CREATE INDEX idx_onerous_assessment_company ON onerous_assessment(company_id);
CREATE INDEX idx_onerous_assessment_date ON onerous_assessment(as_of_date);
CREATE INDEX idx_onerous_assessment_component ON onerous_assessment(lease_component_id);
CREATE INDEX idx_onerous_assessment_status ON onerous_assessment(status);
CREATE INDEX idx_onerous_roll_assessment ON onerous_roll(assessment_id);
CREATE INDEX idx_onerous_roll_period ON onerous_roll(year, month);
CREATE INDEX idx_onerous_post_lock_assessment ON onerous_post_lock(assessment_id);

-- Add comments for clarity
COMMENT ON TABLE onerous_assessment IS 'Onerous contract assessments for non-lease service components (IAS 37)';
COMMENT ON TABLE onerous_roll IS 'Monthly roll-forward of onerous provisions';
COMMENT ON TABLE onerous_post_lock IS 'Idempotency lock for onerous provision journal posting';
