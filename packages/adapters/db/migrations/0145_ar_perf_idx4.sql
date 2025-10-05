BEGIN;
CREATE INDEX IF NOT EXISTS ar_stmt_line_bucket_idx ON ar_statement_line(company_id, customer_id, bucket);
COMMIT;
