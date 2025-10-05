-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - SLB Core Tables
-- Migration: 0319_slb_core.sql

-- slb_txn — sale-and-leaseback transaction header
CREATE TABLE slb_txn (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    asset_id TEXT, -- reference to fixed asset if applicable
    asset_desc TEXT NOT NULL, -- asset description
    sale_date DATE NOT NULL,
    sale_price NUMERIC(15,2) NOT NULL,
    fmv NUMERIC(15,2) NOT NULL, -- fair market value
    ccy TEXT NOT NULL CHECK (length(ccy) = 3),
    control_transferred BOOLEAN NOT NULL DEFAULT false, -- MFRS 15 transfer of control
    leaseback_id TEXT REFERENCES lease(id) ON DELETE SET NULL, -- reference to leaseback lease
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'MEASURED', 'POSTED', 'COMPLETED')) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- slb_allocation — gain allocation and ROU retained calculation
CREATE TABLE slb_allocation (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slb_id TEXT NOT NULL REFERENCES slb_txn(id) ON DELETE CASCADE,
    proportion_transferred NUMERIC(7,4) NOT NULL CHECK (proportion_transferred >= 0 AND proportion_transferred <= 1),
    gain_recognized NUMERIC(15,2) NOT NULL DEFAULT 0, -- immediate gain recognition
    gain_deferred NUMERIC(15,2) NOT NULL DEFAULT 0, -- deferred gain liability
    rou_retained NUMERIC(15,2) NOT NULL DEFAULT 0, -- ROU asset retained
    notes JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_slb_txn_company ON slb_txn(company_id);
CREATE INDEX idx_slb_txn_asset ON slb_txn(asset_id);
CREATE INDEX idx_slb_txn_sale_date ON slb_txn(sale_date);
CREATE INDEX idx_slb_txn_status ON slb_txn(status);
CREATE INDEX idx_slb_txn_leaseback ON slb_txn(leaseback_id);
CREATE INDEX idx_slb_allocation_slb ON slb_allocation(slb_id);
