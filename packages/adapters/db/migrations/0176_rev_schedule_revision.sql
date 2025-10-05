BEGIN;

-- Schedule Revision Tracking (M25.2)
-- Tracks changes to revenue recognition schedules
CREATE TABLE rev_sched_rev (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  pob_id TEXT NOT NULL,                          -- references future POB table
  from_period_year INTEGER NOT NULL,
  from_period_month INTEGER NOT NULL CHECK (from_period_month BETWEEN 1 AND 12),
  planned_before NUMERIC NOT NULL,               -- planned amount before revision
  planned_after NUMERIC NOT NULL,                -- planned amount after revision
  delta_planned NUMERIC NOT NULL,                -- change in planned amount
  cause TEXT NOT NULL CHECK (cause IN ('CO','VC_TRUEUP')), -- Change Order or VC True-up
  change_order_id TEXT REFERENCES rev_change_order(id),
  vc_estimate_id TEXT REFERENCES rev_vc_estimate(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_sr_idx ON rev_sched_rev(company_id, pob_id, from_period_year, from_period_month);
CREATE INDEX rev_sr_cause_idx ON rev_sched_rev(company_id, cause, change_order_id, vc_estimate_id);

COMMIT;
