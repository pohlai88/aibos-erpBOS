-- M27.1: Real-Time Signals & Auto-Playbooks - Signal Core Tables
-- Migration: 0280_ops_signal_core.sql

-- Signal ingestion table for real-time event processing
CREATE TABLE ops_signal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    source TEXT NOT NULL,                    -- AR|AP|TREASURY|CLOSE|REV|FX|BANK|CASHFLOW
    kind TEXT NOT NULL,                      -- PTP|DSO|PAYMENT|CONTROL|REVAL|etc
    key TEXT NOT NULL,                       -- entity/segment identifier
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),   -- signal timestamp
    payload JSONB NOT NULL DEFAULT '{}',     -- signal data
    hash TEXT NOT NULL,                      -- content hash for deduplication
    dedup_until TIMESTAMPTZ,                 -- deduplication window
    severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    kpi TEXT,                               -- associated KPI code
    value NUMERIC(28,6),                    -- numeric value if applicable
    unit TEXT,                              -- unit of measurement
    tags TEXT[] DEFAULT '{}',               -- categorization tags
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint for idempotent ingestion
    UNIQUE(company_id, hash)
);

-- Indexes for performance
CREATE INDEX idx_ops_signal_company_source ON ops_signal(company_id, source);
CREATE INDEX idx_ops_signal_company_kind ON ops_signal(company_id, kind);
CREATE INDEX idx_ops_signal_company_kpi ON ops_signal(company_id, kpi);
CREATE INDEX idx_ops_signal_company_ts ON ops_signal(company_id, ts);
CREATE INDEX idx_ops_signal_source_kind_kpi_ts ON ops_signal(source, kind, kpi, ts);
CREATE INDEX idx_ops_signal_hash ON ops_signal(hash);
CREATE INDEX idx_ops_signal_dedup_until ON ops_signal(dedup_until) WHERE dedup_until IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE ops_signal IS 'Real-time signal ingestion for OpsCC rule engine';
COMMENT ON COLUMN ops_signal.source IS 'Signal source: AR, AP, TREASURY, CLOSE, REV, FX, BANK, CASHFLOW';
COMMENT ON COLUMN ops_signal.kind IS 'Signal type: PTP, DSO, PAYMENT, CONTROL, REVAL, etc';
COMMENT ON COLUMN ops_signal.key IS 'Entity/segment identifier for correlation';
COMMENT ON COLUMN ops_signal.hash IS 'Content hash for deduplication';
COMMENT ON COLUMN ops_signal.dedup_until IS 'Deduplication window end time';
COMMENT ON COLUMN ops_signal.severity IS 'Signal severity: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN ops_signal.tags IS 'Categorization tags for filtering';
