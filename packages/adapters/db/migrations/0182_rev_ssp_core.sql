-- M25.3: SSP Catalog Core Tables
-- Standalone Selling Price catalog with evidence hierarchy and governance

CREATE TABLE rev_ssp_catalog (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES rb_product(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (length(currency) = 3),
    ssp NUMERIC(15,2) NOT NULL CHECK (ssp >= 0),
    method TEXT NOT NULL CHECK (method IN ('OBSERVABLE', 'BENCHMARK', 'ADJ_COST', 'RESIDUAL')),
    effective_from DATE NOT NULL,
    effective_to DATE,
    corridor_min_pct NUMERIC(5,4) CHECK (corridor_min_pct >= 0 AND corridor_min_pct <= 1),
    corridor_max_pct NUMERIC(5,4) CHECK (corridor_max_pct >= 0 AND corridor_max_pct <= 5),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEWED', 'APPROVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

CREATE TABLE rev_ssp_evidence (
    id TEXT PRIMARY KEY,
    catalog_id TEXT NOT NULL REFERENCES rev_ssp_catalog(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('OBSERVABLE', 'BENCHMARK', 'ADJ_COST', 'RESIDUAL')),
    note TEXT,
    value NUMERIC(15,2),
    doc_uri TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_ssp_catalog_company_product_idx ON rev_ssp_catalog(company_id, product_id, currency, effective_from DESC);
CREATE INDEX rev_ssp_catalog_status_idx ON rev_ssp_catalog(company_id, status, effective_from);
CREATE INDEX rev_ssp_catalog_effective_idx ON rev_ssp_catalog(company_id, effective_from, effective_to);
CREATE INDEX rev_ssp_evidence_catalog_idx ON rev_ssp_evidence(catalog_id);

-- Unique constraint for active SSP per product/currency
CREATE UNIQUE INDEX rev_ssp_catalog_unique_active ON rev_ssp_catalog(company_id, product_id, currency, effective_from) 
WHERE status = 'APPROVED' AND effective_to IS NULL;

-- Comments for documentation
COMMENT ON TABLE rev_ssp_catalog IS 'Standalone Selling Price catalog with effective dating and governance workflow';
COMMENT ON COLUMN rev_ssp_catalog.ssp IS 'Standalone selling price in specified currency';
COMMENT ON COLUMN rev_ssp_catalog.method IS 'Method used to determine SSP: OBSERVABLE (market price), BENCHMARK (third-party), ADJ_COST (cost-plus), RESIDUAL (fallback)';
COMMENT ON COLUMN rev_ssp_catalog.corridor_min_pct IS 'Minimum percentage of median SSP for validation';
COMMENT ON COLUMN rev_ssp_catalog.corridor_max_pct IS 'Maximum percentage of median SSP for validation';
COMMENT ON COLUMN rev_ssp_catalog.status IS 'Governance status: DRAFT -> REVIEWED -> APPROVED';

COMMENT ON TABLE rev_ssp_evidence IS 'Supporting evidence for SSP determination';
COMMENT ON COLUMN rev_ssp_evidence.source IS 'Evidence source type matching catalog method';
COMMENT ON COLUMN rev_ssp_evidence.value IS 'Supporting value for evidence';
COMMENT ON COLUMN rev_ssp_evidence.doc_uri IS 'URI to supporting documentation';
