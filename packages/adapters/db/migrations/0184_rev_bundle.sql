-- M25.3: Bundle Definition Tables
-- Bundle SKU definitions with component weights and requirements

CREATE TABLE rev_bundle (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    bundle_sku TEXT NOT NULL,
    name TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

CREATE TABLE rev_bundle_component (
    id TEXT PRIMARY KEY,
    bundle_id TEXT NOT NULL REFERENCES rev_bundle(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES rb_product(id) ON DELETE CASCADE,
    weight_pct NUMERIC(5,4) NOT NULL CHECK (weight_pct >= 0 AND weight_pct <= 1),
    required BOOLEAN NOT NULL DEFAULT true,
    min_qty NUMERIC(10,3) DEFAULT 1 CHECK (min_qty > 0),
    max_qty NUMERIC(10,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_bundle_company_sku_idx ON rev_bundle(company_id, bundle_sku, effective_from DESC);
CREATE INDEX rev_bundle_status_idx ON rev_bundle(company_id, status, effective_from);
CREATE INDEX rev_bundle_component_bundle_idx ON rev_bundle_component(bundle_id);
CREATE INDEX rev_bundle_component_product_idx ON rev_bundle_component(product_id);

-- Unique constraint for active bundle SKU per company
CREATE UNIQUE INDEX rev_bundle_unique_active ON rev_bundle(company_id, bundle_sku, effective_from) 
WHERE status = 'ACTIVE' AND effective_to IS NULL;

-- Constraint to ensure bundle component weights sum to 1.0 (within tolerance)
CREATE OR REPLACE FUNCTION check_bundle_weight_sum()
RETURNS TRIGGER AS $$
DECLARE
    total_weight NUMERIC;
BEGIN
    SELECT COALESCE(SUM(weight_pct), 0) INTO total_weight
    FROM rev_bundle_component 
    WHERE bundle_id = NEW.bundle_id;
    
    IF total_weight > 1.0001 THEN
        RAISE EXCEPTION 'Bundle component weights cannot exceed 100%% (current: %%)', total_weight * 100;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rev_bundle_component_weight_check
    AFTER INSERT OR UPDATE ON rev_bundle_component
    FOR EACH ROW
    EXECUTE FUNCTION check_bundle_weight_sum();

-- Comments for documentation
COMMENT ON TABLE rev_bundle IS 'Bundle SKU definitions with effective dating';
COMMENT ON COLUMN rev_bundle.bundle_sku IS 'Parent SKU for the bundle';
COMMENT ON COLUMN rev_bundle.effective_from IS 'Bundle effective start date';
COMMENT ON COLUMN rev_bundle.effective_to IS 'Bundle effective end date (NULL for ongoing)';

COMMENT ON TABLE rev_bundle_component IS 'Individual products within a bundle with allocation weights';
COMMENT ON COLUMN rev_bundle_component.weight_pct IS 'Allocation weight percentage (0.0 to 1.0)';
COMMENT ON COLUMN rev_bundle_component.required IS 'Whether this component is required for the bundle';
COMMENT ON COLUMN rev_bundle_component.min_qty IS 'Minimum quantity required';
COMMENT ON COLUMN rev_bundle_component.max_qty IS 'Maximum quantity allowed (NULL for unlimited)';
