-- M16: Depreciation Schedule
-- Monthly depreciation amounts for each capex plan

CREATE TABLE IF NOT EXISTS depr_schedule (
  id            TEXT PRIMARY KEY,          -- ULID
  company_id    TEXT NOT NULL,
  plan_id       TEXT NOT NULL REFERENCES capex_plan(id),
  year          INT  NOT NULL,
  month         INT  NOT NULL,             -- 1..12
  currency      TEXT NOT NULL,
  present_ccy   TEXT NOT NULL,
  amount        NUMERIC NOT NULL,          -- monthly depreciation
  booked_flag   BOOLEAN NOT NULL DEFAULT false,
  booked_journal_id TEXT,                  -- link to JE id if posted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate schedules
CREATE UNIQUE INDEX IF NOT EXISTS depr_schedule_unique
  ON depr_schedule(company_id, plan_id, year, month);

-- Query accelerators
CREATE INDEX IF NOT EXISTS depr_schedule_company_period_idx
  ON depr_schedule(company_id, year, month);
CREATE INDEX IF NOT EXISTS depr_schedule_plan_idx ON depr_schedule(plan_id);
CREATE INDEX IF NOT EXISTS depr_schedule_booked_idx ON depr_schedule(booked_flag);
CREATE INDEX IF NOT EXISTS depr_schedule_journal_idx ON depr_schedule(booked_journal_id);
