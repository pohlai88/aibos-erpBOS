-- M16.3: Unpost Journal Links
-- Migration 0041: Add posted timestamp for audit trail

-- Add posted timestamp columns for audit trail
ALTER TABLE depr_schedule ADD COLUMN IF NOT EXISTS posted_ts TIMESTAMPTZ;
ALTER TABLE amort_schedule ADD COLUMN IF NOT EXISTS posted_ts TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS depr_schedule_posted_idx ON depr_schedule(company_id, posted_ts);
CREATE INDEX IF NOT EXISTS amort_schedule_posted_idx ON amort_schedule(company_id, posted_ts);
