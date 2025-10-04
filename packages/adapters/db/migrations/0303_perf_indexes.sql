-- M28.3: Componentized ROU & Impairment - Performance Indexes
-- Migration: 0303_perf_indexes.sql

-- Covering indexes for component schedules
CREATE INDEX idx_lease_component_sched_company_lease_period ON lease_component_sched(company_id, year, month) 
    INCLUDE (lease_component_id, open_carry, rou_amort, close_carry);

-- Covering indexes for impairment tests
CREATE INDEX idx_lease_impair_test_company_as_of_date ON lease_impair_test(company_id, as_of_date) 
    INCLUDE (cgu_code, level, method, recoverable_amount, status);

-- Covering indexes for component carrying amounts
CREATE INDEX idx_lease_component_sched_component_carrying ON lease_component_sched(lease_component_id, year, month) 
    INCLUDE (open_carry, close_carry, rou_amort);

-- Composite indexes for disclosure queries
CREATE INDEX idx_lease_component_disclosure_lookup ON lease_component(company_id, class, status) 
    INCLUDE (id, code, name, pct_of_rou);

-- Indexes for restoration provisions
CREATE INDEX idx_lease_restoration_prov_component_period ON lease_restoration_prov(component_id, year, month) 
    INCLUDE (opening, additions, unwind_interest, utilizations, closing);
