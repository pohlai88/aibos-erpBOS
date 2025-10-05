-- M26.6: Close Cockpit & SLA Board - Views
-- Heat-map and aggregation views for dashboard performance

CREATE VIEW v_close_board_heat AS
SELECT company_id, period, process,
  SUM(CASE WHEN sla_state='LATE' THEN 1 ELSE 0 END) AS late,
  SUM(CASE WHEN sla_state='ESCALATED' THEN 1 ELSE 0 END) AS escal,
  SUM(CASE WHEN status='OPEN' THEN 1 ELSE 0 END) AS open_cnt,
  COUNT(*) AS total
FROM close_item
GROUP BY company_id, period, process;
