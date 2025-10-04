-- M28.3: Componentized ROU & Impairment - Component Links
-- Migration: 0298_lease_components_links.sql

-- lease_component_link — optional mapping to FA classes or cost centers for reporting
CREATE TABLE lease_component_link (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT NOT NULL,
    lease_component_id TEXT NOT NULL REFERENCES lease_component(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('FA_CLASS', 'COST_CENTER', 'PROJECT', 'OTHER')),
    link_value TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lease_component_id, link_type, link_value)
);

-- Indexes for performance
CREATE INDEX idx_lease_component_link_component ON lease_component_link(lease_component_id);
CREATE INDEX idx_lease_component_link_company_type ON lease_component_link(company_id, link_type);
CREATE INDEX idx_lease_component_link_value ON lease_component_link(link_type, link_value);
