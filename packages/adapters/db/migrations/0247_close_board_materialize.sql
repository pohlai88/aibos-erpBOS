-- M26.6: Close Cockpit & SLA Board - Materialized Views
-- Optional materialized views for heavy dashboard queries

-- Materialized view for close board heat-map (refresh as needed)
CREATE MATERIALIZED VIEW mv_close_board_heat AS
SELECT 
  company_id, 
  period, 
  process,
  SUM(CASE WHEN sla_state='LATE' THEN 1 ELSE 0 END) AS late,
  SUM(CASE WHEN sla_state='ESCALATED' THEN 1 ELSE 0 END) AS escal,
  SUM(CASE WHEN status='OPEN' THEN 1 ELSE 0 END) AS open_cnt,
  SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_cnt,
  SUM(CASE WHEN status='BLOCKED' THEN 1 ELSE 0 END) AS blocked_cnt,
  SUM(CASE WHEN status='DONE' THEN 1 ELSE 0 END) AS done_cnt,
  COUNT(*) AS total,
  AVG(aging_days) AS avg_aging_days,
  MAX(aging_days) AS max_aging_days
FROM close_item
GROUP BY company_id, period, process;

-- Create index on materialized view
CREATE INDEX idx_mv_close_board_heat_lookup ON mv_close_board_heat(company_id, period);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_close_board_heat()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_close_board_heat;
END;
$$ LANGUAGE plpgsql;
