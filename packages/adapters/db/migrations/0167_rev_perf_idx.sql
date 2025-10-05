BEGIN;

-- Revenue Recognition Performance Indexes (M25.1)
-- Additional indexes for query optimization

-- POB status and date lookups
CREATE INDEX rev_pob_status_idx ON rev_pob(company_id, status, start_date);
CREATE INDEX rev_pob_end_date_idx ON rev_pob(company_id, end_date) WHERE end_date IS NOT NULL;

-- Recognition line lookups
CREATE INDEX rev_rec_line_pob_idx ON rev_rec_line(company_id, pob_id, year, month);
CREATE INDEX rev_rec_line_account_idx ON rev_rec_line(company_id, dr_account, cr_account);

-- Schedule lookups
CREATE INDEX rev_sched_status_pob_idx ON rev_schedule(company_id, status, pob_id);
CREATE INDEX rev_sched_period_status_idx ON rev_schedule(company_id, year, month, status);

-- Event processing lookups
CREATE INDEX rev_event_unprocessed_idx ON rev_event(company_id, processed_at) WHERE processed_at IS NULL;
CREATE INDEX rev_event_kind_date_idx ON rev_event(company_id, kind, occurred_at);

COMMIT;
