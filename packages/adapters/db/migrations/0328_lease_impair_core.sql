-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - Core Tables
-- Migration: 0328_lease_impair_core.sql

-- Cash Generating Units (CGU) for impairment testing
CREATE TABLE lease_cgu (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    UNIQUE(company_id, code)
);

-- CGU allocation mapping for lease components
CREATE TABLE lease_cgu_link (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    cgu_id TEXT NOT NULL REFERENCES lease_cgu(id) ON DELETE CASCADE,
    weight NUMERIC(7,4) NOT NULL CHECK (weight >= 0 AND weight <= 1), -- allocation weight (0-1)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    UNIQUE(lease_component_id, cgu_id)
);

-- Impairment indicators (triggers for testing)
CREATE TABLE lease_imp_indicator (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    as_of_date DATE NOT NULL,
    cgu_id TEXT REFERENCES lease_cgu(id) ON DELETE CASCADE, -- null for component-specific indicators
    lease_component_id TEXT REFERENCES lease_component(id) ON DELETE CASCADE, -- null for CGU-level indicators
    kind TEXT NOT NULL CHECK (kind IN ('BUDGET_SHORTFALL', 'VACANCY', 'MARKET_RENT_DROP', 'SUBLEASE_LOSS', 'OTHER')),
    value JSONB NOT NULL, -- indicator-specific data (e.g., vacancy %, budget delta)
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    source TEXT NOT NULL, -- source of indicator (e.g., 'BUDGET_SYSTEM', 'MANUAL', 'MARKET_DATA')
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Impairment test results
CREATE TABLE lease_imp_test (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    cgu_id TEXT NOT NULL REFERENCES lease_cgu(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('VIU', 'FVLCD', 'HIGHER')), -- Value in Use, Fair Value Less Costs of Disposal, Higher of both
    discount_rate NUMERIC(9,6) NOT NULL, -- discount rate used (e.g., 0.085 for 8.5%)
    cashflows JSONB NOT NULL, -- discounted cash flow projections
    carrying_amount NUMERIC(18,2) NOT NULL, -- total carrying amount of CGU
    recoverable_amount NUMERIC(18,2) NOT NULL, -- higher of VIU and FVLCD
    loss NUMERIC(18,2) NOT NULL DEFAULT 0, -- impairment loss (carrying - recoverable)
    reversal_cap NUMERIC(18,2) NOT NULL DEFAULT 0, -- maximum reversal allowed (IAS 36)
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'POSTED')) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Impairment test line items (component-level allocation)
CREATE TABLE lease_imp_line (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT NOT NULL REFERENCES lease_imp_test(id) ON DELETE CASCADE,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    carrying NUMERIC(18,2) NOT NULL, -- component carrying amount
    alloc_pct NUMERIC(7,4) NOT NULL CHECK (alloc_pct >= 0 AND alloc_pct <= 1), -- allocation percentage
    loss NUMERIC(18,2) NOT NULL DEFAULT 0, -- allocated impairment loss
    reversal_cap NUMERIC(18,2) NOT NULL DEFAULT 0, -- reversal cap for this component
    posted BOOLEAN NOT NULL DEFAULT false, -- whether JE has been posted
    notes JSONB, -- additional notes/metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Posting lock for idempotent journal entry posting
CREATE TABLE lease_imp_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    test_id TEXT NOT NULL REFERENCES lease_imp_test(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    journal_id TEXT, -- reference to posted journal
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(test_id, year, month)
);

-- Add indexes for performance
CREATE INDEX idx_lease_cgu_company ON lease_cgu(company_id);
CREATE INDEX idx_lease_cgu_link_component ON lease_cgu_link(lease_component_id);
CREATE INDEX idx_lease_cgu_link_cgu ON lease_cgu_link(cgu_id);
CREATE INDEX idx_lease_imp_indicator_date ON lease_imp_indicator(as_of_date);
CREATE INDEX idx_lease_imp_indicator_cgu ON lease_imp_indicator(cgu_id);
CREATE INDEX idx_lease_imp_indicator_component ON lease_imp_indicator(lease_component_id);
CREATE INDEX idx_lease_imp_test_date_cgu ON lease_imp_test(as_of_date, cgu_id);
CREATE INDEX idx_lease_imp_test_status ON lease_imp_test(status);CREATE INDEX idx_lease_imp_line_test ON lease_imp_line(test_id);
CREATE INDEX idx_lease_imp_line_component ON lease_imp_line(lease_component_id);
CREATE INDEX idx_lease_imp_post_lock_test ON lease_imp_post_lock(test_id);

-- Add comments for clarity
COMMENT ON TABLE lease_cgu IS 'Cash Generating Units for lease impairment testing (IAS 36)';
COMMENT ON TABLE lease_cgu_link IS 'Allocation mapping between lease components and CGUs';
COMMENT ON TABLE lease_imp_indicator IS 'Impairment indicators triggering impairment tests';
COMMENT ON TABLE lease_imp_test IS 'Impairment test results with VIU/FVLCD calculations';
COMMENT ON TABLE lease_imp_line IS 'Component-level impairment loss allocation';
COMMENT ON TABLE lease_imp_post_lock IS 'Idempotency lock for impairment journal posting';

