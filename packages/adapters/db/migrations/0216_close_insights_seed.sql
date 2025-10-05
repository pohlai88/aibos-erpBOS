-- M26.2: Close Insights & Benchmarks - Seed Data
-- Migration: 0216_close_insights_seed.sql

-- Seed default benchmark targets
INSERT INTO ins_bench_target (id, company_id, metric, target, effective_from, created_by, updated_by) 
SELECT 
    'target_' || company_id || '_' || metric || '_default',
    company_id,
    metric,
    target_value,
    CURRENT_DATE,
    'system',
    'system'
FROM (
    VALUES 
        ('DAYS_TO_CLOSE', 5.0),
        ('ON_TIME_RATE', 0.9),
        ('AVG_TASK_AGE', 24.0),
        ('LATE_TASKS', 0.0),
        ('EXCEPTIONS_MATERIAL', 0.0),
        ('CONTROL_FAIL_RATE', 0.05),
        ('FLUX_COMMENT_COVERAGE', 0.8)
) AS defaults(metric, target_value)
CROSS JOIN (SELECT DISTINCT company_id FROM close_run) AS companies
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE ins_bench_target IS 'Seeded with default target values for common metrics';
