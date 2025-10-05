-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Performance Indexes
-- Migration: 0322_perf_indexes.sql

-- Covering indexes for sublease schedule queries
CREATE INDEX idx_sublease_schedule_covering ON sublease_schedule(sublease_id, year, month) 
    INCLUDE (opening_nis, interest_income, receipt, closing_nis, lease_income);

-- Covering index for SLB transaction queries by sale date
CREATE INDEX idx_slb_txn_sale_date_covering ON slb_txn(sale_date) 
    INCLUDE (company_id, asset_id, sale_price, fmv, control_transferred, status);

-- Composite indexes for sublease cashflow queries
CREATE INDEX idx_sublease_cf_sublease_due ON sublease_cf(sublease_id, due_on) 
    INCLUDE (amount, variable);

-- Index for sublease event queries
CREATE INDEX idx_sublease_event_sublease_effective ON sublease_event(sublease_id, effective_on) 
    INCLUDE (kind, payload);

-- Index for lease component sublet queries
CREATE INDEX idx_lease_component_sublet_covering ON lease_component_sublet(lease_component_id, sublease_id) 
    INCLUDE (proportion, method);
