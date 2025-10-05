-- M26: Auditor-Friendly Views
-- Views for close status, flux top movers, and SLA breaches

-- Close Status View
CREATE VIEW vw_close_status AS
SELECT 
    cr.id as run_id,
    cr.company_id,
    cr.year,
    cr.month,
    cr.status as run_status,
    cr.owner,
    cr.started_at,
    cr.closed_at,
    COUNT(ct.id) as total_tasks,
    COUNT(CASE WHEN ct.status = 'DONE' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN ct.status = 'OPEN' THEN 1 END) as open_tasks,
    COUNT(CASE WHEN ct.status = 'BLOCKED' THEN 1 END) as blocked_tasks,
    COUNT(CASE WHEN ct.status = 'REJECTED' THEN 1 END) as rejected_tasks,
    COUNT(CASE WHEN ct.sla_due_at < NOW() AND ct.status NOT IN ('DONE', 'REJECTED') THEN 1 END) as sla_breaches,
    ROUND(
        CASE 
            WHEN COUNT(ct.id) > 0 
            THEN (COUNT(CASE WHEN ct.status = 'DONE' THEN 1 END)::NUMERIC / COUNT(ct.id)::NUMERIC) * 100 
            ELSE 0 
        END, 2
    ) as completion_pct
FROM close_run cr
LEFT JOIN close_task ct ON cr.id = ct.run_id
GROUP BY cr.id, cr.company_id, cr.year, cr.month, cr.status, cr.owner, cr.started_at, cr.closed_at;

-- Flux Top Movers View
CREATE VIEW vw_flux_top_movers AS
SELECT 
    fr.id as run_id,
    fr.company_id,
    fr.base_year,
    fr.base_month,
    fr.cmp_year,
    fr.cmp_month,
    fr.present_ccy,
    fl.account_code,
    fl.dim_key,
    fl.base_amount,
    fl.cmp_amount,
    fl.delta,
    fl.delta_pct,
    fl.material,
    fl.requires_comment,
    CASE 
        WHEN fl.delta > 0 THEN 'INCREASE'
        WHEN fl.delta < 0 THEN 'DECREASE'
        ELSE 'NO_CHANGE'
    END as direction,
    ABS(fl.delta) as abs_delta
FROM flux_run fr
JOIN flux_line fl ON fr.id = fl.run_id
WHERE fl.material = TRUE
ORDER BY fr.company_id, fr.cmp_year, fr.cmp_month, ABS(fl.delta) DESC;

-- Close SLA Breaches View
CREATE VIEW vw_close_sla_breaches AS
SELECT 
    cr.id as run_id,
    cr.company_id,
    cr.year,
    cr.month,
    cr.owner,
    ct.id as task_id,
    ct.code as task_code,
    ct.title as task_title,
    ct.sla_due_at,
    ct.status as task_status,
    EXTRACT(EPOCH FROM (NOW() - ct.sla_due_at))/3600 as hours_overdue,
    CASE 
        WHEN ct.sla_due_at < NOW() - INTERVAL '24 hours' THEN 'CRITICAL'
        WHEN ct.sla_due_at < NOW() THEN 'OVERDUE'
        WHEN ct.sla_due_at < NOW() + INTERVAL '24 hours' THEN 'DUE_SOON'
        ELSE 'ON_TRACK'
    END as breach_severity
FROM close_run cr
JOIN close_task ct ON cr.id = ct.run_id
WHERE ct.sla_due_at IS NOT NULL
AND ct.status NOT IN ('DONE', 'REJECTED')
AND ct.sla_due_at < NOW() + INTERVAL '24 hours'
ORDER BY cr.company_id, cr.year, cr.month, ct.sla_due_at ASC;

-- Comments
COMMENT ON VIEW vw_close_status IS 'Comprehensive close run status with task completion metrics';
COMMENT ON VIEW vw_flux_top_movers IS 'Material flux variances sorted by absolute delta';
COMMENT ON VIEW vw_close_sla_breaches IS 'Tasks with SLA breaches or approaching deadlines';
