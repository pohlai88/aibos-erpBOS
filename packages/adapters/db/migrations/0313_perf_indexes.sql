-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0313_perf_indexes.sql

-- Performance indexes for M28.4 tables
CREATE INDEX idx_lease_mod_line_lease_component_id ON lease_mod_line(lease_component_id);
CREATE INDEX idx_lease_component_sched_delta_lease_component_id_year_month ON lease_component_sched_delta(lease_component_id, year, month);

-- Composite indexes for common query patterns
CREATE INDEX idx_lease_mod_company_status_effective ON lease_mod(company_id, status, effective_on);
CREATE INDEX idx_lease_index_profile_company_next_reset ON lease_index_profile(company_id, next_reset_on);
CREATE INDEX idx_lease_remeasure_post_company_period ON lease_remeasure_post(company_id, year, month);
