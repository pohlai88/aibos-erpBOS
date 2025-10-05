BEGIN;
CREATE INDEX IF NOT EXISTS alloc_rule_active_order_idx
  ON alloc_rule(company_id, active, order_no);
CREATE INDEX IF NOT EXISTS alloc_driver_value_find_idx
  ON alloc_driver_value(company_id, driver_code, year, month);
COMMIT;
