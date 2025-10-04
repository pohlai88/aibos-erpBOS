-- M28.3: Componentized ROU & Impairment - Core Components
-- Migration: 0297_lease_components_core.sql

-- lease_component — ROU componentization (code, name, class, uom, pct_of_rou, useful_life_months, method, units_basis, incentive_alloc, restoration_alloc, start_on, end_on, status)
CREATE TABLE lease_component (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL CHECK (class IN ('Land', 'Building', 'Fit-out', 'IT/Equipment', 'Vehicles', 'Others')),
    uom TEXT, -- unit of measure
    pct_of_rou NUMERIC(8,5) NOT NULL CHECK (pct_of_rou > 0 AND pct_of_rou <= 1),
    useful_life_months INTEGER NOT NULL CHECK (useful_life_months > 0),
    method TEXT NOT NULL CHECK (method IN ('SL', 'DDB', 'Units')) DEFAULT 'SL',
    units_basis NUMERIC(15,2), -- for units-based depreciation
    incentive_alloc NUMERIC(18,2) NOT NULL DEFAULT 0,
    restoration_alloc NUMERIC(18,2) NOT NULL DEFAULT 0,
    start_on DATE NOT NULL,
    end_on DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CLOSED')) DEFAULT 'ACTIVE',
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lease_id, code)
);

-- lease_component_sched — monthly component schedules (year, month, open_carry, rou_amort, interest, close_carry, liab_interest, liab_reduction, idx)
CREATE TABLE lease_component_sched (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    open_carry NUMERIC(18,2) NOT NULL,
    rou_amort NUMERIC(18,2) NOT NULL,
    interest NUMERIC(18,2) NOT NULL DEFAULT 0,
    close_carry NUMERIC(18,2) NOT NULL,
    liab_interest NUMERIC(18,2) NOT NULL DEFAULT 0,
    liab_reduction NUMERIC(18,2) NOT NULL DEFAULT 0,
    idx JSONB, -- additional calculation metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, lease_component_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_lease_component_company_lease ON lease_component(company_id, lease_id);
CREATE INDEX idx_lease_component_company_class ON lease_component(company_id, class);
CREATE INDEX idx_lease_component_lease_code ON lease_component(lease_id, code);
CREATE INDEX idx_lease_component_sched_component_period ON lease_component_sched(lease_component_id, year, month);
CREATE INDEX idx_lease_component_sched_company_period ON lease_component_sched(company_id, year, month);
