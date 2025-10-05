BEGIN;
CREATE INDEX IF NOT EXISTS ar_cash_app_status_idx ON ar_cash_app(company_id, status, created_at);
CREATE INDEX IF NOT EXISTS ar_ptp_status_idx ON ar_ptp(company_id, status, promised_date);
CREATE INDEX IF NOT EXISTS ar_dispute_status_idx ON ar_dispute(company_id, status, created_at);
COMMIT;
