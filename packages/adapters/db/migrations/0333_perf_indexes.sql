-- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) - Performance Indexes
-- Migration: 0333_perf_indexes.sql

-- Covering indexes for impairment tests
CREATE INDEX idx_lease_imp_test_date_cgu_covering ON lease_imp_test(as_of_date, cgu_id) 
    INCLUDE (method, carrying_amount, recoverable_amount, loss, status);

-- Covering indexes for onerous roll
CREATE INDEX idx_onerous_roll_assessment_period_covering ON onerous_roll(assessment_id, year, month)
    INCLUDE (opening, charge, unwind, utilization, closing, posted);

-- Additional performance indexes
CREATE INDEX idx_lease_imp_indicator_kind_severity ON lease_imp_indicator(kind, severity);
CREATE INDEX idx_lease_imp_test_method_status ON lease_imp_test(method, status);
CREATE INDEX idx_onerous_assessment_service_item ON onerous_assessment(service_item);
CREATE INDEX idx_onerous_roll_posted ON onerous_roll(posted);

-- Composite indexes for common query patterns
CREATE INDEX idx_lease_imp_test_company_date ON lease_imp_test(company_id, as_of_date);
CREATE INDEX idx_onerous_assessment_company_date ON onerous_assessment(company_id, as_of_date);
CREATE INDEX idx_lease_imp_indicator_company_date ON lease_imp_indicator(company_id, as_of_date);
