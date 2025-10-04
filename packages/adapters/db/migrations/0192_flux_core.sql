-- M26: Flux Analysis Core Tables
-- Automated PL/BS/CF variance analysis with rules & thresholds; comments & assignments

-- Flux Analysis Rules
CREATE TABLE flux_rule (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('PL', 'BS', 'CF')),
    dim TEXT NOT NULL CHECK (dim IN ('ACCOUNT', 'COST_CENTER', 'PROJECT', 'NONE')),
    threshold_abs NUMERIC,
    threshold_pct NUMERIC,
    require_comment BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Flux Analysis Runs
CREATE TABLE flux_run (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    base_year INTEGER NOT NULL,
    base_month INTEGER NOT NULL,
    cmp_year INTEGER NOT NULL,
    cmp_month INTEGER NOT NULL,
    present_ccy TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'ERROR')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Flux Analysis Lines
CREATE TABLE flux_line (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES flux_run(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    dim_key TEXT,
    base_amount NUMERIC NOT NULL DEFAULT 0,
    cmp_amount NUMERIC NOT NULL DEFAULT 0,
    delta NUMERIC NOT NULL DEFAULT 0,
    delta_pct NUMERIC NOT NULL DEFAULT 0,
    requires_comment BOOLEAN NOT NULL DEFAULT FALSE,
    material BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Flux Comments
CREATE TABLE flux_comment (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES flux_run(id) ON DELETE CASCADE,
    line_id TEXT NOT NULL REFERENCES flux_line(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX flux_rule_company_scope_idx ON flux_rule(company_id, scope, active);
CREATE INDEX flux_run_company_period_idx ON flux_run(company_id, cmp_year, cmp_month);
CREATE INDEX flux_run_status_idx ON flux_run(company_id, status, created_at);
CREATE INDEX flux_line_run_idx ON flux_line(run_id);
CREATE INDEX flux_line_material_idx ON flux_line(material);
CREATE INDEX flux_line_account_idx ON flux_line(account_code);
CREATE INDEX flux_comment_line_idx ON flux_comment(line_id);
CREATE INDEX flux_comment_run_idx ON flux_comment(run_id);

-- Comments for documentation
COMMENT ON TABLE flux_rule IS 'Rules for flux analysis thresholds and materiality';
COMMENT ON TABLE flux_run IS 'Flux analysis runs comparing periods';
COMMENT ON TABLE flux_line IS 'Individual flux analysis lines with variance calculations';
COMMENT ON TABLE flux_comment IS 'Comments on flux analysis lines';
COMMENT ON COLUMN flux_run.present_ccy IS 'Present currency for analysis (converted amounts)';
COMMENT ON COLUMN flux_line.material IS 'Whether this variance is material based on rules';
COMMENT ON COLUMN flux_line.requires_comment IS 'Whether comment is required for this line';
