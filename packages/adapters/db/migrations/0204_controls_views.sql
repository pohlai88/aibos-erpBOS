-- M26.1: Auto-Controls & Certifications - Auditable Views
-- Migration: 0204_controls_views.sql

-- Control Status View
CREATE VIEW vw_ctrl_status AS
SELECT 
    c.company_id,
    c.code,
    c.name,
    c.domain,
    c.severity,
    c.status as control_status,
    COUNT(a.id) as assignment_count,
    COUNT(CASE WHEN a.active = true THEN 1 END) as active_assignments,
    MAX(cr.scheduled_at) as last_run_scheduled,
    MAX(cr.finished_at) as last_run_finished,
    MAX(cr.status) as last_run_status,
    COUNT(CASE WHEN cr.status = 'FAIL' AND cr.finished_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_failures
FROM ctrl_control c
LEFT JOIN ctrl_assignment a ON c.id = a.control_id
LEFT JOIN ctrl_run cr ON c.id = cr.control_id
GROUP BY c.id, c.company_id, c.code, c.name, c.domain, c.severity, c.status;

-- Open Exceptions View
CREATE VIEW vw_ctrl_exceptions_open AS
SELECT 
    e.id,
    e.ctrl_run_id,
    cr.company_id,
    c.code as control_code,
    c.name as control_name,
    c.domain,
    c.severity,
    e.code as exception_code,
    e.message,
    e.item_ref,
    e.material,
    e.remediation_state,
    e.assignee,
    e.due_at,
    e.created_at,
    CASE 
        WHEN e.due_at IS NOT NULL AND e.due_at < NOW() THEN true
        ELSE false
    END as sla_breach,
    CASE 
        WHEN e.due_at IS NOT NULL THEN EXTRACT(EPOCH FROM (NOW() - e.due_at)) / 86400
        ELSE NULL
    END as days_overdue
FROM ctrl_exception e
JOIN ctrl_run cr ON e.ctrl_run_id = cr.id
JOIN ctrl_control c ON cr.control_id = c.id
WHERE e.remediation_state IN ('OPEN', 'IN_PROGRESS');

-- SLA Breaches View
CREATE VIEW vw_ctrl_sla_breaches AS
SELECT 
    a.id as assignment_id,
    a.company_id,
    c.code as control_code,
    c.name as control_name,
    c.domain,
    c.severity,
    a.owner,
    a.approver,
    a.sla_due_at,
    cr.id as run_id,
    cr.status as run_status,
    cr.finished_at,
    CASE 
        WHEN a.sla_due_at < NOW() AND cr.status NOT IN ('PASS', 'WAIVED') THEN true
        ELSE false
    END as sla_breach,
    CASE 
        WHEN a.sla_due_at IS NOT NULL THEN EXTRACT(EPOCH FROM (NOW() - a.sla_due_at)) / 86400
        ELSE NULL
    END as days_overdue
FROM ctrl_assignment a
JOIN ctrl_control c ON a.control_id = c.id
LEFT JOIN ctrl_run cr ON a.id = cr.assignment_id
WHERE a.active = true
AND a.sla_due_at IS NOT NULL;

-- Comments for documentation
COMMENT ON VIEW vw_ctrl_status IS 'Summary view of control status and recent execution history';
COMMENT ON VIEW vw_ctrl_exceptions_open IS 'View of all open exceptions with SLA breach indicators';
COMMENT ON VIEW vw_ctrl_sla_breaches IS 'View of control assignments with SLA breach indicators';
