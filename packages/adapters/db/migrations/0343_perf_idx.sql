-- M28.7: Lease Derecognition - Performance Indexes
-- Migration: 0343_perf_idx.sql

-- Covering indexes for lease exit queries
CREATE INDEX idx_lease_exit_event_date_lease ON lease_exit(event_date, lease_id) 
    INCLUDE (id, company_id, kind, status, settlement, penalty);

CREATE INDEX idx_lease_exit_company_kind_status ON lease_exit(company_id, kind, status) 
    INCLUDE (id, lease_id, event_date, settlement, penalty);

-- Covering indexes for restoration provisions
CREATE INDEX idx_lease_restoration_lease_date ON lease_restoration(lease_id, as_of_date) 
    INCLUDE (id, component_id, estimate, opening, charge, unwind, utilization, closing);

CREATE INDEX idx_lease_restoration_component_date ON lease_restoration(component_id, as_of_date) 
    INCLUDE (id, lease_id, estimate, opening, charge, unwind, utilization, closing);

-- Covering indexes for exit calculations
CREATE INDEX idx_lease_exit_calc_carrying ON lease_exit_calc(exit_id) 
    INCLUDE (id, carrying_rou, carrying_liab, share_pct, derecog_rou, derecog_liab, gain_loss);

-- Covering indexes for buyout FA links
CREATE INDEX idx_lease_buyout_fa_link_exit_date ON lease_buyout_fa_link(exit_id, transfer_date) 
    INCLUDE (id, fa_asset_id, transfer_amount);

-- Comments for documentation
COMMENT ON INDEX idx_lease_exit_event_date_lease IS 'Covering index for exit queries by date and lease';
COMMENT ON INDEX idx_lease_exit_company_kind_status IS 'Covering index for exit queries by company, kind, and status';
COMMENT ON INDEX idx_lease_restoration_lease_date IS 'Covering index for restoration provision queries by lease and date';
COMMENT ON INDEX idx_lease_restoration_component_date IS 'Covering index for restoration provision queries by component and date';
COMMENT ON INDEX idx_lease_exit_calc_carrying IS 'Covering index for exit calculation queries';
COMMENT ON INDEX idx_lease_buyout_fa_link_exit_date IS 'Covering index for buyout FA link queries';
