BEGIN;
CREATE INDEX IF NOT EXISTS ap_run_approval_idx ON ap_run_approval(run_id, step);
CREATE INDEX IF NOT EXISTS sanction_hit_supplier_idx ON sanction_hit(supplier_id, status);
CREATE INDEX IF NOT EXISTS ap_supplier_limit_idx ON ap_supplier_limit(company_id, supplier_id);
COMMIT;
