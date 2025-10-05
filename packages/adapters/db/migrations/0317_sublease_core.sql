-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Core Tables
-- Migration: 0317_sublease_core.sql

-- sublease — sublease header (intermediate lessor economics)
CREATE TABLE sublease (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    head_lease_id TEXT NOT NULL REFERENCES lease(id) ON DELETE CASCADE,
    sublease_code TEXT NOT NULL UNIQUE,
    start_on DATE NOT NULL,
    end_on DATE NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('FINANCE', 'OPERATING')),
    ccy TEXT NOT NULL CHECK (length(ccy) = 3),
    rate NUMERIC(9,6), -- effective interest rate for finance sublease
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED')) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- sublease_cf — cashflows the intermediate lessor receives
CREATE TABLE sublease_cf (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sublease_id TEXT NOT NULL REFERENCES sublease(id) ON DELETE CASCADE,
    due_on DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    variable JSONB, -- variable payment details
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- sublease_schedule — monthly schedule for finance/operating sublease
CREATE TABLE sublease_schedule (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sublease_id TEXT NOT NULL REFERENCES sublease(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    opening_nis NUMERIC(15,2), -- net investment in sublease (finance only)
    interest_income NUMERIC(15,2), -- interest income (finance only)
    receipt NUMERIC(15,2) NOT NULL,
    closing_nis NUMERIC(15,2), -- net investment in sublease (finance only)
    lease_income NUMERIC(15,2), -- lease income (operating only)
    notes JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(sublease_id, year, month)
);

-- sublease_event — remeasurements/modifications for sublease
CREATE TABLE sublease_event (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sublease_id TEXT NOT NULL REFERENCES sublease(id) ON DELETE CASCADE,
    effective_on DATE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('INDEX', 'TERM', 'SCOPE', 'DEFERRAL')),
    payload JSONB NOT NULL, -- event-specific data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- sublease_post_lock — idempotent posting guard
CREATE TABLE sublease_post_lock (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sublease_id TEXT NOT NULL REFERENCES sublease(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    journal_id TEXT, -- reference to posted journal
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    posted_by TEXT NOT NULL,
    UNIQUE(sublease_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_sublease_company ON sublease(company_id);
CREATE INDEX idx_sublease_head_lease ON sublease(head_lease_id);
CREATE INDEX idx_sublease_classification ON sublease(classification);
CREATE INDEX idx_sublease_status ON sublease(status);
CREATE INDEX idx_sublease_cf_sublease ON sublease_cf(sublease_id);
CREATE INDEX idx_sublease_cf_due_on ON sublease_cf(due_on);
CREATE INDEX idx_sublease_schedule_sublease ON sublease_schedule(sublease_id);
CREATE INDEX idx_sublease_schedule_period ON sublease_schedule(year, month);
CREATE INDEX idx_sublease_event_sublease ON sublease_event(sublease_id);
CREATE INDEX idx_sublease_event_effective ON sublease_event(effective_on);
CREATE INDEX idx_sublease_post_lock_sublease ON sublease_post_lock(sublease_id);
CREATE INDEX idx_sublease_post_lock_period ON sublease_post_lock(year, month);
