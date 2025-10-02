BEGIN;
-- Ensure unique snapshot per (company, month-end, src, dst)
CREATE UNIQUE INDEX IF NOT EXISTS fx_admin_rates_uk
ON fx_admin_rates(company_id, as_of_date, src_ccy, dst_ccy);
COMMIT;
