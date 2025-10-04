-- M25.3: Foreign Key Hardening and Constraints
-- Add foreign key constraints and cascade behaviors for data integrity

-- Add foreign key constraints to existing tables where safe
-- Note: Some references may be to future tables (rb_invoice, rb_invoice_line)
-- These will be added when those tables are created

-- SSP Catalog foreign keys (already defined in 0182)
-- rev_ssp_catalog.product_id -> rb_product.id (CASCADE)
-- rev_ssp_evidence.catalog_id -> rev_ssp_catalog.id (CASCADE)

-- Bundle foreign keys (already defined in 0184)
-- rev_bundle_component.bundle_id -> rev_bundle.id (CASCADE)
-- rev_bundle_component.product_id -> rb_product.id (CASCADE)

-- Discount foreign keys (already defined in 0185)
-- rev_discount_applied.rule_id -> rev_discount_rule.id (RESTRICT)

-- Add constraints for data integrity

-- Ensure SSP catalog effective date ranges are valid
ALTER TABLE rev_ssp_catalog ADD CONSTRAINT rev_ssp_catalog_effective_range_check 
CHECK (effective_to IS NULL OR effective_to > effective_from);

-- Ensure bundle effective date ranges are valid
ALTER TABLE rev_bundle ADD CONSTRAINT rev_bundle_effective_range_check 
CHECK (effective_to IS NULL OR effective_to > effective_from);

-- Ensure discount rule effective date ranges are valid
ALTER TABLE rev_discount_rule ADD CONSTRAINT rev_discount_rule_effective_range_check 
CHECK (effective_to IS NULL OR effective_to > effective_from);

-- Ensure discount rule max values are positive
ALTER TABLE rev_discount_rule ADD CONSTRAINT rev_discount_rule_max_usage_count_check 
CHECK (max_usage_count IS NULL OR max_usage_count > 0);

ALTER TABLE rev_discount_rule ADD CONSTRAINT rev_discount_rule_max_usage_amount_check 
CHECK (max_usage_amount IS NULL OR max_usage_amount > 0);

-- Ensure allocation audit amounts are non-negative
ALTER TABLE rev_alloc_audit ADD CONSTRAINT rev_alloc_audit_amounts_check 
CHECK (total_invoice_amount >= 0 AND total_allocated_amount >= 0);

-- Ensure SSP change decision consistency
ALTER TABLE rev_ssp_change ADD CONSTRAINT rev_ssp_change_decision_check 
CHECK (
    (status IN ('DRAFT', 'REVIEWED') AND decided_by IS NULL AND decided_at IS NULL) OR
    (status IN ('APPROVED', 'REJECTED') AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
);

-- Add update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables with updated_at columns
CREATE TRIGGER rev_ssp_catalog_updated_at_trigger
    BEFORE UPDATE ON rev_ssp_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER rev_bundle_updated_at_trigger
    BEFORE UPDATE ON rev_bundle
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER rev_discount_rule_updated_at_trigger
    BEFORE UPDATE ON rev_discount_rule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER rev_ssp_change_updated_at_trigger
    BEFORE UPDATE ON rev_ssp_change
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';
