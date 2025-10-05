BEGIN;
CREATE INDEX IF NOT EXISTS bank_outbox_status_idx ON bank_outbox(company_id, bank_code, status);
CREATE INDEX IF NOT EXISTS bank_ack_map_run_idx ON bank_ack_map(run_id, status);
CREATE INDEX IF NOT EXISTS bank_job_log_kind_idx ON bank_job_log(company_id, kind, created_at);
COMMIT;
