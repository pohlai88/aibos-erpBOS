-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - SLB Adjustments
-- Migration: 0320_slb_adjustments.sql

-- slb_measure — fair-value and pricing adjustments
CREATE TABLE slb_measure (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slb_id TEXT NOT NULL REFERENCES slb_txn(id) ON DELETE CASCADE,
    adj_kind TEXT NOT NULL CHECK (adj_kind IN ('ABOVE_FAIR_VALUE', 'BELOW_FAIR_VALUE', 'COSTS')),
    amount NUMERIC(15,2) NOT NULL,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_slb_measure_slb ON slb_measure(slb_id);
CREATE INDEX idx_slb_measure_kind ON slb_measure(adj_kind);
