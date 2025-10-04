-- M27: Ops Command Center - Materialized Views
-- Migration: 0281_opscc_mviews.sql

-- Materialized view for cash flow aggregates (Executive Board)
CREATE MATERIALIZED VIEW kpi_mv_cashflow AS
SELECT 
  company_id,
  DATE_TRUNC('day', posting_date) as period_date,
  SUM(CASE WHEN dc = 'D' THEN amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN dc = 'C' THEN amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN dc = 'D' THEN amount ELSE -amount END) as net_cashflow,
  COUNT(*) as transaction_count
FROM journal_line jl
JOIN journal j ON jl.journal_id = j.id
WHERE j.posting_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY company_id, DATE_TRUNC('day', posting_date);

-- Materialized view for AR aging aggregates (AR Board)
CREATE MATERIALIZED VIEW kpi_mv_ar_aging AS
SELECT 
  company_id,
  DATE_TRUNC('day', snapshot_date) as period_date,
  SUM(CASE WHEN age_bucket = '0-30' THEN balance ELSE 0 END) as current_balance,
  SUM(CASE WHEN age_bucket = '31-60' THEN balance ELSE 0 END) as days_31_60,
  SUM(CASE WHEN age_bucket = '61-90' THEN balance ELSE 0 END) as days_61_90,
  SUM(CASE WHEN age_bucket = '91+' THEN balance ELSE 0 END) as over_90,
  SUM(balance) as total_ar_balance,
  COUNT(DISTINCT customer_id) as customer_count
FROM ar_age_snapshot
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY company_id, DATE_TRUNC('day', snapshot_date);

-- Materialized view for treasury aggregates (Treasury Board)
CREATE MATERIALIZED VIEW kpi_mv_treasury AS
SELECT 
  company_id,
  DATE_TRUNC('day', created_at) as period_date,
  SUM(CASE WHEN status = 'COMMITTED' AND due_date <= CURRENT_DATE + INTERVAL '14 days' 
           THEN amount ELSE 0 END) as committed_14d,
  SUM(CASE WHEN status = 'COMMITTED' AND due_date <= CURRENT_DATE + INTERVAL '7 days' 
           THEN amount ELSE 0 END) as committed_7d,
  COUNT(CASE WHEN status = 'COMMITTED' THEN 1 END) as committed_count,
  SUM(CASE WHEN discount_captured > 0 THEN discount_captured ELSE 0 END) as total_discounts,
  COUNT(CASE WHEN discount_captured > 0 THEN 1 END) as discount_count
FROM ap_payment_run pr
JOIN ap_payment_master pm ON pr.id = pm.payment_run_id
WHERE pr.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY company_id, DATE_TRUNC('day', pr.created_at);

-- Materialized view for close/controls aggregates (Close Board)
CREATE MATERIALIZED VIEW kpi_mv_close_controls AS
SELECT 
  company_id,
  DATE_TRUNC('day', created_at) as period_date,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::FLOAT / COUNT(*) as completion_rate,
  COUNT(CASE WHEN control_status = 'PASS' THEN 1 END) as passed_controls,
  COUNT(CASE WHEN control_status IN ('FAIL', 'EXCEPTION') THEN 1 END) as failed_controls,
  COUNT(CASE WHEN control_status = 'PASS' THEN 1 END)::FLOAT / 
    NULLIF(COUNT(CASE WHEN control_status IN ('PASS', 'FAIL', 'EXCEPTION') THEN 1 END), 0) as control_pass_rate
FROM close_task ct
LEFT JOIN controls_run cr ON ct.id = cr.task_id
WHERE ct.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY company_id, DATE_TRUNC('day', ct.created_at);

-- Materialized view for FX exposure (Treasury Board)
CREATE MATERIALIZED VIEW kpi_mv_fx_exposure AS
SELECT 
  company_id,
  currency,
  DATE_TRUNC('day', snapshot_date) as period_date,
  SUM(exposure_amount) as total_exposure,
  AVG(spot_rate) as avg_spot_rate,
  COUNT(*) as exposure_count
FROM fx_snapshot
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY company_id, currency, DATE_TRUNC('day', snapshot_date);

-- KPI refresh log for tracking materialized view updates
CREATE TABLE kpi_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  mv_name TEXT NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rows_affected INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'ERROR')) DEFAULT 'SUCCESS',
  error_message TEXT
);

-- Performance indexes for materialized views
CREATE INDEX idx_kpi_mv_cashflow_company_period ON kpi_mv_cashflow(company_id, period_date);
CREATE INDEX idx_kpi_mv_ar_aging_company_period ON kpi_mv_ar_aging(company_id, period_date);
CREATE INDEX idx_kpi_mv_treasury_company_period ON kpi_mv_treasury(company_id, period_date);
CREATE INDEX idx_kpi_mv_close_controls_company_period ON kpi_mv_close_controls(company_id, period_date);
CREATE INDEX idx_kpi_mv_fx_exposure_company_period ON kpi_mv_fx_exposure(company_id, period_date);

CREATE INDEX idx_kpi_refresh_log_company ON kpi_refresh_log(company_id);
CREATE INDEX idx_kpi_refresh_log_refreshed_at ON kpi_refresh_log(refreshed_at);

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW kpi_mv_cashflow IS 'Pre-aggregated cash flow data for Executive Board KPIs';
COMMENT ON MATERIALIZED VIEW kpi_mv_ar_aging IS 'Pre-aggregated AR aging data for AR Board KPIs';
COMMENT ON MATERIALIZED VIEW kpi_mv_treasury IS 'Pre-aggregated treasury data for Treasury Board KPIs';
COMMENT ON MATERIALIZED VIEW kpi_mv_close_controls IS 'Pre-aggregated close/controls data for Close Board KPIs';
COMMENT ON MATERIALIZED VIEW kpi_mv_fx_exposure IS 'Pre-aggregated FX exposure data for Treasury Board KPIs';
COMMENT ON TABLE kpi_refresh_log IS 'Log of materialized view refresh operations';
