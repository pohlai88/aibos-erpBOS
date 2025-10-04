-- M27: Ops Command Center - Views
-- Migration: 0286_opscc_views.sql

-- View for latest KPI snapshots by board
CREATE VIEW v_latest_kpi_snapshots AS
SELECT DISTINCT ON (company_id, board, kpi)
  company_id,
  board,
  kpi,
  ts_utc,
  value,
  num,
  den,
  meta,
  present_ccy,
  basis,
  created_at
FROM kpi_snapshot
ORDER BY company_id, board, kpi, ts_utc DESC;

-- View for active alert events
CREATE VIEW v_active_alerts AS
SELECT 
  ae.id,
  ae.company_id,
  ae.board,
  ae.kpi,
  ae.severity,
  ae.message,
  ae.fired_at,
  ae.status,
  ar.rule_id,
  ar.expr,
  pa.action_id,
  pa.name as action_name,
  pa.description as action_description
FROM alert_event ae
JOIN alert_rule ar ON ae.rule_id = ar.id
LEFT JOIN playbook_action pa ON ae.action_suggestion_id = pa.id
WHERE ae.status IN ('OPEN', 'ACK');

-- View for board tile configurations with KPI data
CREATE VIEW v_board_tiles AS
SELECT 
  ktc.company_id,
  ktc.board,
  ktc.tile_id,
  ktc.kpi,
  ktc.viz,
  ktc.format,
  ktc.targets,
  ktc.order_no,
  bc.name as board_name,
  bc.description as board_description,
  bc.default_present_ccy,
  ks.value,
  ks.ts_utc as last_updated,
  ks.basis
FROM kpi_tile_config ktc
JOIN board_config bc ON ktc.company_id = bc.company_id AND ktc.board = bc.board
LEFT JOIN v_latest_kpi_snapshots ks ON ktc.company_id = ks.company_id 
  AND ktc.board = ks.board 
  AND ktc.kpi = ks.kpi
ORDER BY ktc.company_id, ktc.board, ktc.order_no;

-- View for playbook execution history
CREATE VIEW v_playbook_executions AS
SELECT 
  oo.id,
  oo.company_id,
  oo.event_type,
  oo.event_data,
  oo.created_at,
  oo.processed_at,
  oo.status,
  oo.retry_count,
  oo.error_message
FROM opscc_outbox oo
WHERE oo.event_type = 'PLAYBOOK_EXECUTED'
ORDER BY oo.created_at DESC;

-- View for what-if scenario summaries
CREATE VIEW v_whatif_summaries AS
SELECT 
  company_id,
  board,
  scenario_id,
  name,
  description,
  params,
  baseline_at,
  diff,
  created_at,
  updated_at
FROM whatif_scenario
ORDER BY company_id, board, created_at DESC;

-- Comments for documentation
COMMENT ON VIEW v_latest_kpi_snapshots IS 'Latest KPI snapshot for each company/board/kpi combination';
COMMENT ON VIEW v_active_alerts IS 'Currently active alert events with suggested actions';
COMMENT ON VIEW v_board_tiles IS 'Board tile configurations with latest KPI values';
COMMENT ON VIEW v_playbook_executions IS 'History of playbook executions from outbox';
COMMENT ON VIEW v_whatif_summaries IS 'Summary of saved what-if scenarios';
