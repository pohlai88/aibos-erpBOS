BEGIN;
CREATE INDEX IF NOT EXISTS bank_txn_import_date_idx ON bank_txn_import(company_id, acct_code, txn_date);
COMMIT;
