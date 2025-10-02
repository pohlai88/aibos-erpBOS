BEGIN;
CREATE TABLE IF NOT EXISTS ap_pay_lock (
  company_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  PRIMARY KEY (company_id, invoice_id)
);
CREATE INDEX IF NOT EXISTS ap_run_status_idx ON ap_pay_run(company_id, status);
CREATE INDEX IF NOT EXISTS ap_line_supplier_idx ON ap_pay_line(run_id, supplier_id);
COMMIT;
