-- M26: Close KPI Tracking
-- Performance metrics for close operations

CREATE TABLE close_kpi (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    metric TEXT NOT NULL CHECK (metric IN ('DAYS_TO_CLOSE', 'ON_TIME_RATE', 'AVG_TASK_AGE', 'LATE_TASKS')),
    value NUMERIC NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for KPI queries
CREATE INDEX close_kpi_company_metric_idx ON close_kpi(company_id, metric, computed_at);
CREATE INDEX close_kpi_run_idx ON close_kpi(run_id);
CREATE INDEX close_kpi_computed_idx ON close_kpi(computed_at DESC);

-- Comments
COMMENT ON TABLE close_kpi IS 'Close performance metrics and KPIs';
COMMENT ON COLUMN close_kpi.metric IS 'KPI metric type: DAYS_TO_CLOSE, ON_TIME_RATE, AVG_TASK_AGE, LATE_TASKS';
COMMENT ON COLUMN close_kpi.value IS 'KPI value (days, percentage, count, etc.)';
COMMENT ON COLUMN close_kpi.computed_at IS 'When this KPI was computed';
