-- M15.2 Phase 2: Database Optimization
-- High-performance indexes and materialized views for cash alerts

-- Optimized indexes for cash alerts evaluation
CREATE INDEX CONCURRENTLY IF NOT EXISTS cash_line_evaluation_idx 
ON cash_line (company_id, version_id, year, month) 
INCLUDE (net_change, cost_center, project, currency, present_ccy);

-- Index for cash forecast version lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS cash_version_company_status_idx
ON cash_forecast_version (company_id, status, updated_at DESC);

-- Index for cash alert rules
CREATE INDEX CONCURRENTLY IF NOT EXISTS cash_alert_rule_active_idx
ON cash_alert_rule (company_id, is_active, type);

-- Composite index for company settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS company_settings_lookup_idx
ON company_settings (company_id) 
INCLUDE (timezone, cash_version_code);

-- Materialized view for fast cash balance calculations
CREATE MATERIALIZED VIEW IF NOT EXISTS cash_balance_snapshot AS
SELECT 
  company_id,
  version_id,
  year,
  month,
  currency,
  present_ccy,
  cost_center,
  project,
  net_change,
  -- Cumulative balance calculation
  SUM(net_change) OVER (
    PARTITION BY company_id, version_id, cost_center, project 
    ORDER BY year, month 
    ROWS UNBOUNDED PRECEDING
  ) as cumulative_balance,
  -- Average burn rate over last 3 months
  AVG(CASE WHEN net_change < 0 THEN -net_change ELSE 0 END) 
    OVER (
      PARTITION BY company_id, version_id, cost_center, project 
      ORDER BY year, month 
      ROWS 2 PRECEDING
    ) as avg_burn_rate_3m,
  -- Monthly burn rate
  CASE WHEN net_change < 0 THEN -net_change ELSE 0 END as monthly_burn,
  -- Runway calculation (months of cash remaining)
  CASE 
    WHEN net_change < 0 THEN 
      SUM(net_change) OVER (
        PARTITION BY company_id, version_id, cost_center, project 
        ORDER BY year, month 
        ROWS UNBOUNDED PRECEDING
      ) / NULLIF(-net_change, 0)
    ELSE NULL 
  END as runway_months
FROM cash_line
WHERE net_change IS NOT NULL;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS cash_balance_snapshot_unique_idx
ON cash_balance_snapshot (company_id, version_id, year, month, cost_center, project);

-- Create indexes on materialized view for fast lookups
CREATE INDEX IF NOT EXISTS cash_balance_snapshot_company_period_idx
ON cash_balance_snapshot (company_id, year, month);

CREATE INDEX IF NOT EXISTS cash_balance_snapshot_version_idx
ON cash_balance_snapshot (company_id, version_id);

CREATE INDEX IF NOT EXISTS cash_balance_snapshot_balance_idx
ON cash_balance_snapshot (company_id, cumulative_balance) 
WHERE cumulative_balance IS NOT NULL;

CREATE INDEX IF NOT EXISTS cash_balance_snapshot_burn_idx
ON cash_balance_snapshot (company_id, avg_burn_rate_3m) 
WHERE avg_burn_rate_3m > 0;

CREATE INDEX IF NOT EXISTS cash_balance_snapshot_runway_idx
ON cash_balance_snapshot (company_id, runway_months) 
WHERE runway_months IS NOT NULL AND runway_months > 0;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_cash_balance_snapshot()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cash_balance_snapshot;
  
  -- Log refresh completion
  INSERT INTO system_log (event_type, message, created_at)
  VALUES ('materialized_view_refresh', 'cash_balance_snapshot refreshed', now());
END;
$$ LANGUAGE plpgsql;

-- Function to get cash metrics for a company/version/period
CREATE OR REPLACE FUNCTION get_cash_metrics(
  p_company_id TEXT,
  p_version_id TEXT,
  p_year INTEGER,
  p_month INTEGER,
  p_cost_center TEXT DEFAULT NULL,
  p_project TEXT DEFAULT NULL
)
RETURNS TABLE (
  cumulative_balance NUMERIC,
  avg_burn_rate_3m NUMERIC,
  monthly_burn NUMERIC,
  runway_months NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cbs.cumulative_balance,
    cbs.avg_burn_rate_3m,
    cbs.monthly_burn,
    cbs.runway_months
  FROM cash_balance_snapshot cbs
  WHERE cbs.company_id = p_company_id
    AND cbs.version_id = p_version_id
    AND cbs.year = p_year
    AND cbs.month = p_month
    AND (p_cost_center IS NULL OR cbs.cost_center = p_cost_center)
    AND (p_project IS NULL OR cbs.project = p_project)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to evaluate cash alerts using materialized view
CREATE OR REPLACE FUNCTION evaluate_cash_alerts_fast(
  p_company_id TEXT,
  p_version_id TEXT,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  rule_id TEXT,
  rule_name TEXT,
  rule_type TEXT,
  cost_center TEXT,
  project TEXT,
  threshold NUMERIC,
  current_value NUMERIC,
  breach_detected BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    car.id as rule_id,
    car.name as rule_name,
    car.type as rule_type,
    car.filter_cc as cost_center,
    car.filter_project as project,
    car.threshold_num as threshold,
    CASE 
      WHEN car.type = 'min_cash' THEN cbs.cumulative_balance
      WHEN car.type = 'max_burn' THEN cbs.avg_burn_rate_3m
      WHEN car.type = 'runway_months' THEN cbs.runway_months
      ELSE NULL
    END as current_value,
    CASE 
      WHEN car.type = 'min_cash' THEN cbs.cumulative_balance < car.threshold_num
      WHEN car.type = 'max_burn' THEN cbs.avg_burn_rate_3m > car.threshold_num
      WHEN car.type = 'runway_months' THEN cbs.runway_months < car.threshold_num
      ELSE FALSE
    END as breach_detected
  FROM cash_alert_rule car
  CROSS JOIN cash_balance_snapshot cbs
  WHERE car.company_id = p_company_id
    AND car.is_active = true
    AND cbs.company_id = p_company_id
    AND cbs.version_id = p_version_id
    AND cbs.year = p_year
    AND cbs.month = p_month
    AND (car.filter_cc IS NULL OR cbs.cost_center = car.filter_cc)
    AND (car.filter_project IS NULL OR cbs.project = car.filter_project)
    AND (
      (car.type = 'min_cash' AND cbs.cumulative_balance < car.threshold_num) OR
      (car.type = 'max_burn' AND cbs.avg_burn_rate_3m > car.threshold_num) OR
      (car.type = 'runway_months' AND cbs.runway_months < car.threshold_num)
    );
END;
$$ LANGUAGE plpgsql;

-- Create system log table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_log (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for system log queries
CREATE INDEX IF NOT EXISTS system_log_event_type_idx
ON system_log (event_type, created_at DESC);

-- Schedule automatic refresh (requires pg_cron extension)
-- Note: This requires superuser privileges and pg_cron extension
-- Uncomment if you have pg_cron installed:
-- SELECT cron.schedule('refresh-cash-balance-snapshot', '0 */6 * * *', 'SELECT refresh_cash_balance_snapshot();');

-- Grant necessary permissions
GRANT SELECT ON cash_balance_snapshot TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_cash_metrics TO PUBLIC;
GRANT EXECUTE ON FUNCTION evaluate_cash_alerts_fast TO PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_cash_balance_snapshot TO PUBLIC;
