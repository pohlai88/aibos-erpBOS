-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Views and Rollups
-- Migration: 0327_views_rollups.sql

-- View for sublease summary with head lease details
CREATE VIEW v_sublease_summary AS
SELECT 
    s.id,
    s.company_id,
    s.sublease_code,
    s.start_on,
    s.end_on,
    s.classification,
    s.ccy,
    s.rate,
    s.status,
    l.lease_code as head_lease_code,
    l.lessor as head_lessor,
    l.asset_class,
    COUNT(scf.id) as cashflow_count,
    SUM(scf.amount) as total_cashflows,
    s.created_at,
    s.created_by
FROM sublease s
JOIN lease l ON s.head_lease_id = l.id
LEFT JOIN sublease_cf scf ON s.id = scf.sublease_id
GROUP BY s.id, s.company_id, s.sublease_code, s.start_on, s.end_on, s.classification, 
         s.ccy, s.rate, s.status, l.lease_code, l.lessor, l.asset_class, s.created_at, s.created_by;

-- View for SLB transaction summary
CREATE VIEW v_slb_summary AS
SELECT 
    st.id,
    st.company_id,
    st.asset_desc,
    st.sale_date,
    st.sale_price,
    st.fmv,
    st.ccy,
    st.control_transferred,
    st.status,
    l.lease_code as leaseback_code,
    sa.proportion_transferred,
    sa.gain_recognized,
    sa.gain_deferred,
    sa.rou_retained,
    st.created_at,
    st.created_by
FROM slb_txn st
LEFT JOIN lease l ON st.leaseback_id = l.id
LEFT JOIN slb_allocation sa ON st.id = sa.slb_id;

-- View for sublease schedule rollup by period
CREATE VIEW v_sublease_schedule_rollup AS
SELECT 
    s.company_id,
    ss.year,
    ss.month,
    COUNT(DISTINCT ss.sublease_id) as sublease_count,
    SUM(CASE WHEN s.classification = 'FINANCE' THEN ss.interest_income ELSE 0 END) as finance_interest_total,
    SUM(CASE WHEN s.classification = 'OPERATING' THEN ss.lease_income ELSE 0 END) as operating_income_total,
    SUM(ss.receipt) as total_receipts,
    SUM(CASE WHEN s.classification = 'FINANCE' THEN ss.closing_nis ELSE 0 END) as total_nis_closing
FROM sublease_schedule ss
JOIN sublease s ON ss.sublease_id = s.id
GROUP BY s.company_id, ss.year, ss.month;

-- View for SLB disclosure rollup
CREATE VIEW v_slb_disclosure_rollup AS
SELECT 
    st.company_id,
    EXTRACT(YEAR FROM st.sale_date) as year,
    EXTRACT(MONTH FROM st.sale_date) as month,
    COUNT(*) as slb_count,
    SUM(st.sale_price) as total_cash_proceeds,
    SUM(sa.gain_recognized) as total_gains_recognized,
    SUM(sa.gain_deferred) as total_gains_deferred,
    SUM(sa.rou_retained) as total_rou_retained
FROM slb_txn st
LEFT JOIN slb_allocation sa ON st.id = sa.slb_id
WHERE st.status = 'POSTED'
GROUP BY st.company_id, EXTRACT(YEAR FROM st.sale_date), EXTRACT(MONTH FROM st.sale_date);

-- Grant permissions on views
GRANT SELECT ON v_sublease_summary TO authenticated;
GRANT SELECT ON v_slb_summary TO authenticated;
GRANT SELECT ON v_sublease_schedule_rollup TO authenticated;
GRANT SELECT ON v_slb_disclosure_rollup TO authenticated;
