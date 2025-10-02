BEGIN;
CREATE INDEX IF NOT EXISTS tax_run_period_idx
  ON tax_return_run(company_id, partner_code, year, month);
CREATE INDEX IF NOT EXISTS tax_box_map_idx
  ON tax_return_box_map(company_id, partner_code, version, box_id, priority);
COMMIT;
