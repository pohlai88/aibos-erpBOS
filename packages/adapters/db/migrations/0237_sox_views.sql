-- M26.5: SOX 302/404 Pack - Reporting Views
-- Dashboard and KPI helpers

CREATE VIEW v_sox_control_health AS
SELECT 
  kc.company_id, 
  kc.code, 
  kc.name,
  kc.process,
  kc.frequency,
  kc.automation,
  kc.owner_id,
  cs.period,
  cs.in_scope,
  COUNT(DISTINCT tp.id) as test_plans,
  COUNT(DISTINCT ts.id) as samples_tested,
  SUM(CASE WHEN tr.outcome = 'FAIL' THEN 1 ELSE 0 END) as fails,
  SUM(CASE WHEN tr.outcome = 'PASS' THEN 1 ELSE 0 END) as passes,
  SUM(CASE WHEN tr.outcome = 'N/A' THEN 1 ELSE 0 END) as na_count,
  CASE 
    WHEN COUNT(tr.id) = 0 THEN 0.0
    ELSE ROUND(
      (SUM(CASE WHEN tr.outcome = 'PASS' THEN 1 ELSE 0 END)::NUMERIC / COUNT(tr.id)) * 100, 
      2
    )
  END as pass_rate
FROM sox_key_control kc
LEFT JOIN sox_control_scope cs ON cs.control_id = kc.id
LEFT JOIN sox_test_plan tp ON tp.control_id = kc.id AND tp.period = cs.period
LEFT JOIN sox_test_sample ts ON ts.plan_id = tp.id
LEFT JOIN sox_test_result tr ON tr.plan_id = tp.id
WHERE kc.active = true
GROUP BY kc.company_id, kc.code, kc.name, kc.process, kc.frequency, kc.automation, kc.owner_id, cs.period, cs.in_scope;

CREATE VIEW v_sox_deficiency_summary AS
SELECT 
  company_id,
  discovered_in,
  type,
  severity,
  status,
  COUNT(*) as deficiency_count,
  COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_count,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_count,
  AVG(CASE 
    WHEN status = 'CLOSED' THEN EXTRACT(DAYS FROM (updated_at - created_at))
    ELSE EXTRACT(DAYS FROM (CURRENT_DATE - created_at::DATE))
  END) as avg_age_days
FROM sox_deficiency
GROUP BY company_id, discovered_in, type, severity, status;

CREATE VIEW v_sox_assertion_status AS
SELECT 
  company_id,
  period,
  type,
  COUNT(*) as assertion_count,
  COUNT(CASE WHEN signed_at IS NOT NULL THEN 1 END) as signed_count,
  COUNT(CASE WHEN signed_at IS NULL THEN 1 END) as pending_count,
  MAX(signed_at) as last_signed_at
FROM sox_assertion
GROUP BY company_id, period, type;
