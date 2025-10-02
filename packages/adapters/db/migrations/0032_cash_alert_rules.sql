-- M15.1: Cash/Liquidity Alerts
-- Cash alert rules for monitoring cash balance, burn rate, and runway

CREATE TABLE IF NOT EXISTS cash_alert_rule (
  id             TEXT PRIMARY KEY,           -- ULID
  company_id     TEXT NOT NULL,
  name           TEXT NOT NULL,              -- e.g., "Min Cash 3m Runway"
  type           TEXT NOT NULL,              -- min_cash|max_burn|runway_months
  threshold_num  NUMERIC NOT NULL,           -- currency amount or months
  filter_cc      TEXT,                       -- optional cost center
  filter_project TEXT,                       -- optional project
  delivery       JSONB NOT NULL,             -- { "email":["..."], "webhook":"https://..." }
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS cash_alert_rule_company_idx
  ON cash_alert_rule (company_id);
