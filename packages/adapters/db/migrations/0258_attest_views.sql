-- M26.7: Attestations Portal - Views
-- Heat map and summary views for dashboard

CREATE VIEW v_attest_heat AS
SELECT 
  company_id, 
  campaign_id,
  SUM(CASE WHEN sla_state='LATE' THEN 1 ELSE 0 END) AS late,
  SUM(CASE WHEN sla_state='ESCALATED' THEN 1 ELSE 0 END) AS escalated,
  SUM(CASE WHEN state='OPEN' THEN 1 ELSE 0 END) AS open_cnt,
  SUM(CASE WHEN state='SUBMITTED' THEN 1 ELSE 0 END) AS submitted_cnt,
  SUM(CASE WHEN state='APPROVED' THEN 1 ELSE 0 END) AS approved_cnt,
  COUNT(*) AS total
FROM attest_task
GROUP BY company_id, campaign_id;

CREATE VIEW v_attest_campaign_summary AS
SELECT 
  c.id as campaign_id,
  c.company_id,
  c.period,
  c.due_at,
  c.state,
  p.name as program_name,
  t.title as template_title,
  h.late,
  h.escalated,
  h.open_cnt,
  h.submitted_cnt,
  h.approved_cnt,
  h.total,
  CASE 
    WHEN h.total > 0 THEN ROUND((h.approved_cnt::numeric / h.total::numeric) * 100, 2)
    ELSE 0 
  END as completion_rate
FROM attest_campaign c
JOIN attest_program p ON c.program_id = p.id
JOIN attest_template t ON c.template_id = t.id
LEFT JOIN v_attest_heat h ON c.id = h.campaign_id;
