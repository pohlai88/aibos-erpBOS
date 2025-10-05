-- M28.4: Lease Modifications & Indexation Remeasurements
-- Migration: 0316_seed_idx_codes.sql

-- Optional seed: CPI-XX series, FX mapping hints
INSERT INTO lease_index_value (company_id, index_code, index_date, value) VALUES
-- US CPI series (example data)
('default', 'CPI-US', '2024-01-01', 100.0000),
('default', 'CPI-US', '2024-02-01', 100.2000),
('default', 'CPI-US', '2024-03-01', 100.5000),
('default', 'CPI-US', '2024-04-01', 100.8000),
('default', 'CPI-US', '2024-05-01', 101.1000),
('default', 'CPI-US', '2024-06-01', 101.4000),

-- UK CPI series (example data)
('default', 'CPI-UK', '2024-01-01', 100.0000),
('default', 'CPI-UK', '2024-02-01', 100.1500),
('default', 'CPI-UK', '2024-03-01', 100.3500),
('default', 'CPI-UK', '2024-04-01', 100.5500),
('default', 'CPI-UK', '2024-05-01', 100.7500),
('default', 'CPI-UK', '2024-06-01', 100.9500),

-- EUR CPI series (example data)
('default', 'CPI-EUR', '2024-01-01', 100.0000),
('default', 'CPI-EUR', '2024-02-01', 100.1000),
('default', 'CPI-EUR', '2024-03-01', 100.2500),
('default', 'CPI-EUR', '2024-04-01', 100.4000),
('default', 'CPI-EUR', '2024-05-01', 100.5500),
('default', 'CPI-EUR', '2024-06-01', 100.7000);

-- Seed default concession policy
INSERT INTO lease_concession_policy (id, company_id, method, component_alloc, notes, created_by, updated_by) VALUES
('default-concession-policy', 'default', 'STRAIGHT_LINE', 'PRORATA', 'Default policy: straight-line treatment with pro-rata allocation', 'system', 'system');
