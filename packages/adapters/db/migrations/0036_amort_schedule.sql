-- M16.1: Amortization Schedule
-- Monthly amortization amounts for each intangible plan

CREATE TABLE IF NOT EXISTS amort_schedule (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES intangible_plan(id),
  year INT NOT NULL,
  month INT NOT NULL,
  currency TEXT NOT NULL,
  present_ccy TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  booked_flag BOOLEAN NOT NULL DEFAULT false,
  booked_journal_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate schedules
CREATE UNIQUE INDEX IF NOT EXISTS amort_schedule_unique
  ON amort_schedule(company_id, plan_id, year, month);

-- Query accelerators
CREATE INDEX IF NOT EXISTS amort_schedule_company_period_idx
  ON amort_schedule(company_id, year, month);
CREATE INDEX IF NOT EXISTS amort_schedule_plan_idx ON amort_schedule(plan_id);
CREATE INDEX IF NOT EXISTS amort_schedule_booked_idx ON amort_schedule(booked_flag);
CREATE INDEX IF NOT EXISTS amort_schedule_journal_idx ON amort_schedule(booked_journal_id);
