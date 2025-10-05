-- M28: Lease Accounting (MFRS 16) - Core Tables
-- Migration: 0295_lease_core_m28.sql

-- lease — header (lessee, asset class, commencement date, term, payments, indexation, options, incentives, initial direct costs, restoration costs)
CREATE TABLE lease (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_code TEXT NOT NULL UNIQUE,
    lessor TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('Land/Building', 'IT/Equipment', 'Vehicles', 'Others')),
    ccy TEXT NOT NULL CHECK (length(ccy) = 3),
    commence_on DATE NOT NULL,
    end_on DATE NOT NULL,
    payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY')),
    discount_rate NUMERIC(10,6) NOT NULL,
    rate_kind TEXT NOT NULL CHECK (rate_kind IN ('fixed', 'floating')) DEFAULT 'fixed',
    index_code TEXT, -- CPI index for floating rates
    short_term_exempt BOOLEAN NOT NULL DEFAULT false,
    low_value_exempt BOOLEAN NOT NULL DEFAULT false,
    present_ccy TEXT CHECK (length(present_ccy) = 3), -- presentation currency (M17)
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED')) DEFAULT 'DRAFT',
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- lease_cashflow — normalized payments (due_on, amount, in_substance_fixed, variable_flag, index_base, index_link_id, paid_flag)
CREATE TABLE lease_cashflow (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    due_on DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    in_substance_fixed BOOLEAN NOT NULL DEFAULT true,
    variable_flag BOOLEAN NOT NULL DEFAULT false,
    index_base NUMERIC(10,6), -- base index rate for variable payments
    index_link_id TEXT, -- reference to index rate changes
    paid_flag BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- lease_opening — derived opening measures (initial_liability, initial_rou, incentives, idc, restoration)
CREATE TABLE lease_opening (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    initial_liability NUMERIC(15,2) NOT NULL,
    initial_rou NUMERIC(15,2) NOT NULL,
    incentives_received NUMERIC(15,2) NOT NULL DEFAULT 0,
    initial_direct_costs NUMERIC(15,2) NOT NULL DEFAULT 0,
    restoration_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    computed_by TEXT NOT NULL
);

-- lease_schedule — monthly rows (year, month, open_liab, interest, payment, fx_reval, close_liab, rou_amort, rou_carry, notes)
CREATE TABLE lease_schedule (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    open_liab NUMERIC(15,2) NOT NULL,
    interest NUMERIC(15,2) NOT NULL,
    payment NUMERIC(15,2) NOT NULL,
    fx_reval NUMERIC(15,2) NOT NULL DEFAULT 0,
    close_liab NUMERIC(15,2) NOT NULL,
    rou_amort NUMERIC(15,2) NOT NULL,
    rou_carry NUMERIC(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lease_id, year, month)
);

-- lease_event — remeasurements/modifications (kind, effective_on, drivers: index_rate, delta_term, delta_pay, scope_change_pct, termination_flag)
CREATE TABLE lease_event (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('INDEX', 'RATE', 'TERM', 'SCOPE', 'TERMINATION')),
    effective_on DATE NOT NULL,
    index_rate NUMERIC(10,6), -- new index rate for CPI changes
    delta_term INTEGER, -- change in lease term (months)
    delta_pay NUMERIC(15,2), -- change in payment amount
    scope_change_pct NUMERIC(5,2), -- percentage change in scope
    termination_flag BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- lease_post_lock — idempotency/period guard linkage to GL (ties to postJournal())
CREATE TABLE lease_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('LOCKED', 'POSTING', 'POSTED', 'ERROR')) DEFAULT 'LOCKED',
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by TEXT,
    error_msg TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, year, month)
);

-- lease_disclosure — snapshot by period for report packs (rollforwards, maturity table, WADR)
CREATE TABLE lease_disclosure (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    maturity_jsonb JSONB NOT NULL, -- maturity analysis by time bands
    rollforward_jsonb JSONB NOT NULL, -- additions/remeasurements/terminations
    wadr NUMERIC(10,6) NOT NULL, -- weighted average discount rate
    short_term_expense NUMERIC(15,2) NOT NULL DEFAULT 0,
    low_value_expense NUMERIC(15,2) NOT NULL DEFAULT 0,
    variable_expense NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_cash_outflow NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, year, month)
);

-- lease_attachment — evidence pointers (→ M26.4 blobs)
CREATE TABLE lease_attachment (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    evidence_id TEXT NOT NULL, -- references M26.4 evidence vault
    attachment_type TEXT NOT NULL CHECK (attachment_type IN ('AGREEMENT', 'CPI_NOTICE', 'IDC_SUPPORT', 'OTHER')),
    description TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lease_company_code ON lease(company_id, lease_code);
CREATE INDEX idx_lease_company_class_status ON lease(company_id, asset_class, status);
CREATE INDEX idx_lease_company_commence ON lease(company_id, commence_on);
CREATE INDEX idx_lease_cashflow_lease_due ON lease_cashflow(lease_id, due_on);
CREATE INDEX idx_lease_schedule_lease_period ON lease_schedule(lease_id, year, month);
CREATE INDEX idx_lease_schedule_company_period ON lease_schedule(lease_id, year, month);
CREATE INDEX idx_lease_event_lease_effective ON lease_event(lease_id, effective_on);
CREATE INDEX idx_lease_post_lock_company_period ON lease_post_lock(company_id, year, month);
CREATE INDEX idx_lease_disclosure_company_period ON lease_disclosure(company_id, year, month);
CREATE INDEX idx_lease_attachment_lease_type ON lease_attachment(lease_id, attachment_type);

-- GIN indexes for JSONB columns
CREATE INDEX idx_lease_disclosure_maturity_jsonb ON lease_disclosure USING GIN (maturity_jsonb);
CREATE INDEX idx_lease_disclosure_rollforward_jsonb ON lease_disclosure USING GIN (rollforward_jsonb);

-- Comments for documentation
COMMENT ON TABLE lease IS 'Lease master data with MFRS 16 compliance fields';
COMMENT ON TABLE lease_cashflow IS 'Normalized lease payments with variable/in-substance fixed flags';
COMMENT ON TABLE lease_opening IS 'Derived opening measures: ROU asset and lease liability';
COMMENT ON TABLE lease_schedule IS 'Monthly amortization schedule with interest and ROU amortization';
COMMENT ON TABLE lease_event IS 'Remeasurements and modifications affecting lease accounting';
COMMENT ON TABLE lease_post_lock IS 'Period guard and idempotency for GL posting';
COMMENT ON TABLE lease_disclosure IS 'Period snapshots for MFRS 16 disclosure requirements';
COMMENT ON TABLE lease_attachment IS 'Evidence links to M26.4 vault for audit trail';
