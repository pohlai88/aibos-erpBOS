-- M26.2: Close Insights & Benchmarks - Anomaly Detection Tables
-- Migration: 0212_close_anomaly.sql

-- Anomaly Detection Table
CREATE TABLE ins_anomaly (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('TASK', 'CONTROL', 'FLUX', 'DURATION')),
    signal JSONB NOT NULL DEFAULT '{}',
    score NUMERIC NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recommendations Table
CREATE TABLE ins_reco (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    reco_code TEXT NOT NULL,
    title TEXT NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}',
    impact_estimate NUMERIC NOT NULL DEFAULT 0,
    effort TEXT NOT NULL CHECK (effort IN ('LOW', 'MEDIUM', 'HIGH')),
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'PLANNED', 'DONE')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acted_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Comments for documentation
COMMENT ON TABLE ins_anomaly IS 'Detected anomalies with severity scoring and lifecycle';
COMMENT ON TABLE ins_reco IS 'Actionable recommendations with impact and effort estimates';
