-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - Views and Rollups
-- Migration: 0337_views_rollups.sql

-- View for CGU-level impairment summary
CREATE VIEW v_cgu_impairment_summary AS
SELECT 
    cgu.id as cgu_id,
    cgu.company_id,
    cgu.code as cgu_code,
    cgu.name as cgu_name,
    it.as_of_date,
    it.method,
    it.carrying_amount,
    it.recoverable_amount,
    it.loss,
    it.status,
    COUNT(il.id) as component_count,
    SUM(il.loss) as total_allocated_loss,
    it.created_at,
    it.created_by
FROM lease_cgu cgu
LEFT JOIN lease_imp_test it ON cgu.id = it.cgu_id
LEFT JOIN lease_imp_line il ON it.id = il.test_id
GROUP BY cgu.id, cgu.company_id, cgu.code, cgu.name, it.as_of_date, it.method, 
         it.carrying_amount, it.recoverable_amount, it.loss, it.status, it.created_at, it.created_by;

-- View for company-level impairment rollup by period
CREATE VIEW v_impairment_rollup AS
SELECT 
    it.company_id,
    EXTRACT(YEAR FROM it.as_of_date) as year,
    EXTRACT(MONTH FROM it.as_of_date) as month,
    COUNT(DISTINCT it.cgu_id) as cgu_count,
    COUNT(DISTINCT it.id) as test_count,
    SUM(it.loss) as total_impairment_loss,
    SUM(CASE WHEN it.status = 'POSTED' THEN it.loss ELSE 0 END) as posted_loss,
    SUM(CASE WHEN it.status = 'DRAFT' THEN it.loss ELSE 0 END) as draft_loss
FROM lease_imp_test it
GROUP BY it.company_id, EXTRACT(YEAR FROM it.as_of_date), EXTRACT(MONTH FROM it.as_of_date);

-- View for onerous contract summary
CREATE VIEW v_onerous_summary AS
SELECT 
    oa.id as assessment_id,
    oa.company_id,
    oa.as_of_date,
    oa.service_item,
    oa.term_months,
    oa.unavoidable_cost,
    oa.expected_benefit,
    oa.provision,
    oa.status,
    lc.code as lease_component_code,
    lc.name as lease_component_name,
    COUNT(or.id) as roll_count,
    SUM(or.opening) as total_opening,
    SUM(or.closing) as total_closing,
    oa.created_at,
    oa.created_by
FROM onerous_assessment oa
LEFT JOIN lease_component lc ON oa.lease_component_id = lc.id
LEFT JOIN onerous_roll or ON oa.id = or.assessment_id
GROUP BY oa.id, oa.company_id, oa.as_of_date, oa.service_item, oa.term_months,
         oa.unavoidable_cost, oa.expected_benefit, oa.provision, oa.status,
         lc.code, lc.name, oa.created_at, oa.created_by;

-- View for onerous provision rollup by period
CREATE VIEW v_onerous_rollup AS
SELECT 
    oa.company_id,
    or.year,
    or.month,
    COUNT(DISTINCT oa.id) as assessment_count,
    SUM(or.opening) as total_opening,
    SUM(or.charge) as total_charge,
    SUM(or.unwind) as total_unwind,
    SUM(or.utilization) as total_utilization,
    SUM(or.closing) as total_closing,
    SUM(CASE WHEN or.posted THEN or.charge ELSE 0 END) as posted_charge,
    SUM(CASE WHEN or.posted THEN or.unwind ELSE 0 END) as posted_unwind
FROM onerous_assessment oa
JOIN onerous_roll or ON oa.id = or.assessment_id
GROUP BY oa.company_id, or.year, or.month;

-- View for impairment indicators summary
CREATE VIEW v_impairment_indicators_summary AS
SELECT 
    ii.company_id,
    ii.as_of_date,
    ii.kind,
    ii.severity,
    COUNT(*) as indicator_count,
    COUNT(DISTINCT ii.cgu_id) as cgu_count,
    COUNT(DISTINCT ii.lease_component_id) as component_count,
    AVG(CASE WHEN ii.kind = 'VACANCY' THEN (ii.value->>'vacancy_pct')::numeric ELSE NULL END) as avg_vacancy_pct,
    AVG(CASE WHEN ii.kind = 'BUDGET_SHORTFALL' THEN (ii.value->>'shortfall_pct')::numeric ELSE NULL END) as avg_shortfall_pct
FROM lease_imp_indicator ii
GROUP BY ii.company_id, ii.as_of_date, ii.kind, ii.severity;

-- Grant permissions on views
GRANT SELECT ON v_cgu_impairment_summary TO authenticated;
GRANT SELECT ON v_impairment_rollup TO authenticated;
GRANT SELECT ON v_onerous_summary TO authenticated;
GRANT SELECT ON v_onerous_rollup TO authenticated;
GRANT SELECT ON v_impairment_indicators_summary TO authenticated;
