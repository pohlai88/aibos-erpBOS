-- M26.2: Close Insights & Benchmarks - Analytics Views
-- Migration: 0213_close_insights_views.sql

-- KPI Trend View
CREATE VIEW vw_ins_kpi_trend AS
SELECT 
    company_id,
    year,
    month,
    AVG(days_to_close) as avg_days_to_close,
    AVG(on_time_rate) as avg_on_time_rate,
    SUM(late_tasks) as total_late_tasks,
    SUM(exceptions_material) as total_material_exceptions,
    COUNT(*) as run_count
FROM ins_fact_close
GROUP BY company_id, year, month
ORDER BY company_id, year, month;

-- Benchmark Delta View
CREATE VIEW vw_ins_benchmark_delta AS
SELECT 
    b.company_id,
    b.metric,
    b.entity_group,
    b.granularity,
    b.value as current_value,
    b.p50,
    b.p75,
    b.p90,
    t.target,
    (b.value - t.target) as delta_to_target,
    (b.value - b.p50) as delta_to_p50,
    (b.value - b.p90) as delta_to_p90,
    b.window_start,
    b.window_end
FROM ins_bench_baseline b
LEFT JOIN ins_bench_target t ON (
    b.company_id = t.company_id 
    AND b.metric = t.metric 
    AND b.window_start >= t.effective_from 
    AND (t.effective_to IS NULL OR b.window_start <= t.effective_to)
);

-- Bottlenecks View
CREATE VIEW vw_ins_bottlenecks AS
SELECT 
    company_id,
    code,
    owner,
    COUNT(*) as occurrence_count,
    AVG(age_hours) as avg_age_hours,
    MAX(age_hours) as max_age_hours,
    SUM(CASE WHEN breached THEN 1 ELSE 0 END) as breach_count,
    AVG(CASE WHEN breached THEN 1.0 ELSE 0.0 END) as breach_rate
FROM ins_fact_task
WHERE status IN ('OPEN', 'BLOCKED', 'READY')
GROUP BY company_id, code, owner
ORDER BY avg_age_hours DESC, breach_rate DESC;

-- Comments for documentation
COMMENT ON VIEW vw_ins_kpi_trend IS 'Aggregated KPI trends by company and period';
COMMENT ON VIEW vw_ins_benchmark_delta IS 'Benchmark comparisons with targets and percentiles';
COMMENT ON VIEW vw_ins_bottlenecks IS 'Task bottleneck analysis by code and owner';
