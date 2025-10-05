BEGIN;

-- Performance Indexes for Revenue Modifications (M25.2)
-- Additional indexes for query optimization

-- Change order lookups
CREATE INDEX rev_co_status_idx ON rev_change_order(company_id, status, effective_date);
CREATE INDEX rev_co_contract_status_idx ON rev_change_order(contract_id, status);

-- Change line lookups
CREATE INDEX rev_cl_pob_idx ON rev_change_line(pob_id) WHERE pob_id IS NOT NULL;
CREATE INDEX rev_cl_product_idx ON rev_change_line(product_id) WHERE product_id IS NOT NULL;

-- VC estimate lookups
CREATE INDEX rev_vc_est_contract_idx ON rev_vc_estimate(contract_id, year, month);
CREATE INDEX rev_vc_est_status_idx ON rev_vc_estimate(company_id, status, year, month);

-- Transaction price revision lookups
CREATE INDEX rev_tpr_change_idx ON rev_txn_price_rev(change_order_id);

-- Schedule revision lookups
CREATE INDEX rev_sr_period_idx ON rev_sched_rev(from_period_year, from_period_month);
CREATE INDEX rev_sr_pob_period_idx ON rev_sched_rev(pob_id, from_period_year, from_period_month);

-- Catch-up lookups
CREATE INDEX rev_rc_run_idx ON rev_rec_catchup(run_id);
CREATE INDEX rev_rc_period_idx ON rev_rec_catchup(year, month);

-- Disclosure lookups
CREATE INDEX rev_mr_date_idx ON rev_mod_register(effective_date);
CREATE INDEX rev_vcr_period_idx ON rev_vc_rollforward(year, month);

COMMIT;
