-- M28.3: Componentized ROU & Impairment - Impairment Core
-- Migration: 0299_lease_impair_core.sql

-- lease_impair_test — impairment testing header (cgu_code, level, method, discount_rate, recoverable_amount, trigger, as_of_date, status, notes)
CREATE TABLE lease_impair_test (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    cgu_code TEXT NOT NULL, -- cash generating unit code
    level TEXT NOT NULL CHECK (level IN ('COMPONENT', 'CGU')),
    method TEXT NOT NULL CHECK (method IN ('VIU', 'FVLCD')),
    discount_rate NUMERIC(6,4) NOT NULL CHECK (discount_rate > 0 AND discount_rate < 1),
    recoverable_amount NUMERIC(18,2) NOT NULL,
    trigger TEXT NOT NULL CHECK (trigger IN ('INDICATOR', 'ANNUAL', 'EVENT')),
    as_of_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'MEASURED', 'POSTED')) DEFAULT 'DRAFT',
    notes TEXT,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- lease_impair_line — impairment allocation to components (lease_component_id, carrying_amount, allocated_loss, allocated_reversal, after_amount)
CREATE TABLE lease_impair_line (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    impair_test_id TEXT NOT NULL REFERENCES lease_impair_test(id) ON DELETE CASCADE,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    carrying_amount NUMERIC(18,2) NOT NULL,
    allocated_loss NUMERIC(18,2) NOT NULL DEFAULT 0,
    allocated_reversal NUMERIC(18,2) NOT NULL DEFAULT 0,
    after_amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lease_impair_test_company_cgu ON lease_impair_test(company_id, cgu_code);
CREATE INDEX idx_lease_impair_test_company_date ON lease_impair_test(company_id, as_of_date);
CREATE INDEX idx_lease_impair_test_status ON lease_impair_test(status);
CREATE INDEX idx_lease_impair_line_test ON lease_impair_line(impair_test_id);
CREATE INDEX idx_lease_impair_line_component ON lease_impair_line(lease_component_id);
