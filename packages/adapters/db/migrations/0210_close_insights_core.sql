-- M26.2: Close Insights & Benchmarks - Core Facts Tables
-- Migration: 0210_close_insights_core.sql

-- Insights Close Facts Table
CREATE TABLE ins_fact_close (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    entity_id TEXT,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    days_to_close NUMERIC NOT NULL,
    on_time_rate NUMERIC NOT NULL,
    late_tasks INTEGER NOT NULL DEFAULT 0,
    exceptions_open INTEGER NOT NULL DEFAULT 0,
    exceptions_material INTEGER NOT NULL DEFAULT 0,
    certs_done INTEGER NOT NULL DEFAULT 0,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insights Task Facts Table
CREATE TABLE ins_fact_task (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES close_run(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL REFERENCES close_task(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    owner TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL,
    age_hours NUMERIC NOT NULL DEFAULT 0,
    breached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insights Control Facts Table
CREATE TABLE ins_fact_ctrl (
    id TEXT PRIMARY KEY,
    ctrl_run_id TEXT NOT NULL REFERENCES ctrl_run(id) ON DELETE CASCADE,
    control_code TEXT NOT NULL,
    status TEXT NOT NULL,
    severity TEXT NOT NULL,
    exceptions_count INTEGER NOT NULL DEFAULT 0,
    waived INTEGER NOT NULL DEFAULT 0,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    material_fail BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insights Flux Facts Table
CREATE TABLE ins_fact_flux (
    id TEXT PRIMARY KEY,
    flux_run_id TEXT NOT NULL REFERENCES flux_run(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    present_ccy TEXT NOT NULL,
    material INTEGER NOT NULL DEFAULT 0,
    comment_missing INTEGER NOT NULL DEFAULT 0,
    top_delta_abs NUMERIC NOT NULL DEFAULT 0,
    top_delta_pct NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insights Certification Facts Table
CREATE TABLE ins_fact_cert (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES close_run(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    signer_role TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE ins_fact_close IS 'Flattened facts from close runs for analytics';
COMMENT ON TABLE ins_fact_task IS 'Task-level facts with SLA breach analysis';
COMMENT ON TABLE ins_fact_ctrl IS 'Control execution facts with exception counts';
COMMENT ON TABLE ins_fact_flux IS 'Flux analysis facts with materiality flags';
COMMENT ON TABLE ins_fact_cert IS 'Certification completion facts';
