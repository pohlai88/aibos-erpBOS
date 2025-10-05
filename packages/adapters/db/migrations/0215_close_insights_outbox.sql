-- M26.2: Close Insights & Benchmarks - Outbox Categories
-- Migration: 0215_close_insights_outbox.sql

-- Add new outbox categories for insights
INSERT INTO outbox_category (id, name, description, created_at) VALUES
('INSIGHTS_ALERT', 'Insights Alert', 'High severity anomaly alerts', NOW()),
('BENCHMARK_DRIFT', 'Benchmark Drift', 'Significant benchmark deviations', NOW()),
('SLA_RECO', 'SLA Recommendation', 'SLA optimization recommendations', NOW())
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE outbox_category IS 'Added insights-specific outbox categories for event-driven notifications';
