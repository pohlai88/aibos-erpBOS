-- M26.2: Close Insights & Benchmarks - Benchmarks Tables
-- Migration: 0211_close_benchmarks.sql

-- Benchmark Baselines Table
CREATE TABLE ins_bench_baseline (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    entity_group TEXT NOT NULL CHECK (entity_group IN ('SELF', 'PEER', 'GLOBAL')),
    metric TEXT NOT NULL,
    granularity TEXT NOT NULL CHECK (granularity IN ('MONTH', 'QUARTER', 'YEAR')),
    value NUMERIC NOT NULL,
    p50 NUMERIC NOT NULL,
    p75 NUMERIC NOT NULL,
    p90 NUMERIC NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Benchmark Targets Table
CREATE TABLE ins_bench_target (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    metric TEXT NOT NULL,
    target NUMERIC NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Comments for documentation
COMMENT ON TABLE ins_bench_baseline IS 'Benchmark baselines with percentile bands (SELF/PEER/GLOBAL)';
COMMENT ON TABLE ins_bench_target IS 'Target values for metrics with effective periods';
