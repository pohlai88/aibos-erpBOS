-- M15.2: Per-Company Cash Alert Schedule Table
-- Allows each company to choose their own local time and scenario code

CREATE TABLE IF NOT EXISTS cash_alert_schedule (
  company_id     TEXT PRIMARY KEY,
  enabled        BOOLEAN NOT NULL DEFAULT true,
  hour_local     INT NOT NULL DEFAULT 8,     -- 0..23
  minute_local   INT NOT NULL DEFAULT 0,     -- 0..59
  timezone       TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  scenario_code  TEXT NOT NULL,              -- e.g., 'CFY26-01'
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by     TEXT NOT NULL
);

-- Index for efficient querying by enabled status
CREATE INDEX IF NOT EXISTS cash_alert_schedule_enabled_idx 
  ON cash_alert_schedule (enabled);

-- Index for timezone-based queries
CREATE INDEX IF NOT EXISTS cash_alert_schedule_timezone_idx 
  ON cash_alert_schedule (timezone);
