BEGIN;
CREATE INDEX IF NOT EXISTS cf_map_idx ON cf_map(company_id, map_code, cf_section);
CREATE INDEX IF NOT EXISTS cf_driver_week_idx ON cf_driver_week(company_id, year, iso_week, driver_code);
CREATE INDEX IF NOT EXISTS bank_balance_day_idx ON bank_balance_day(company_id, as_of_date);
COMMIT;
