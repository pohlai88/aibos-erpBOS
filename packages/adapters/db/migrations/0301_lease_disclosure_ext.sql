-- M28.3: Componentized ROU & Impairment - Disclosure Extensions
-- Migration: 0301_lease_disclosure_ext.sql

-- Extend lease_disclosure to include impairment charges/reversals and component roll-up
ALTER TABLE lease_disclosure 
ADD COLUMN impairment_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
ADD COLUMN impairment_reversals NUMERIC(18,2) NOT NULL DEFAULT 0,
ADD COLUMN component_carrying_amounts JSONB, -- component roll-up by class
ADD COLUMN restoration_provisions_movement JSONB; -- restoration provisions roll-forward

-- Create view for component disclosures
CREATE VIEW lease_component_disclosure AS
SELECT 
    l.company_id,
    l.year,
    l.month,
    lc.class,
    COUNT(DISTINCT lc.id) as component_count,
    SUM(lcs.close_carry) as total_carrying_amount,
    SUM(lcs.rou_amort) as total_amortization,
    SUM(lcs.interest) as total_interest
FROM lease_disclosure l
JOIN lease_component lc ON lc.company_id = l.company_id
JOIN lease_component_sched lcs ON lcs.lease_component_id = lc.id 
    AND lcs.year = l.year 
    AND lcs.month = l.month
WHERE lc.status = 'ACTIVE'
GROUP BY l.company_id, l.year, l.month, lc.class;

-- Create view for impairment disclosures
CREATE VIEW lease_impairment_disclosure AS
SELECT 
    lit.company_id,
    lit.as_of_date,
    lit.cgu_code,
    lit.level,
    lit.method,
    lit.recoverable_amount,
    SUM(lil.allocated_loss) as total_loss,
    SUM(lil.allocated_reversal) as total_reversal,
    COUNT(DISTINCT lil.lease_component_id) as components_tested
FROM lease_impair_test lit
LEFT JOIN lease_impair_line lil ON lil.impair_test_id = lit.id
WHERE lit.status = 'POSTED'
GROUP BY lit.company_id, lit.as_of_date, lit.cgu_code, lit.level, lit.method, lit.recoverable_amount;
