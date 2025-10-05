-- M25.3: Performance Indexes for SSP and Bundle Operations
-- Optimized indexes for high-performance queries

-- SSP Catalog performance indexes
CREATE INDEX rev_ssp_catalog_lookup_idx ON rev_ssp_catalog(company_id, product_id, currency, effective_from DESC, status) 
WHERE status = 'APPROVED';

CREATE INDEX rev_ssp_catalog_effective_range_idx ON rev_ssp_catalog(company_id, effective_from, effective_to) 
WHERE effective_to IS NOT NULL;

CREATE INDEX rev_ssp_catalog_method_idx ON rev_ssp_catalog(company_id, method, effective_from DESC);

-- Bundle performance indexes
CREATE INDEX rev_bundle_lookup_idx ON rev_bundle(company_id, bundle_sku, effective_from DESC, status) 
WHERE status = 'ACTIVE';

CREATE INDEX rev_bundle_component_lookup_idx ON rev_bundle_component(bundle_id, product_id);

-- Discount rule performance indexes
CREATE INDEX rev_discount_rule_lookup_idx ON rev_discount_rule(company_id, code, effective_from DESC, active) 
WHERE active = true;

CREATE INDEX rev_discount_rule_kind_priority_idx ON rev_discount_rule(company_id, kind, priority DESC, effective_from DESC) 
WHERE active = true;

-- Allocation audit performance indexes
CREATE INDEX rev_alloc_audit_performance_idx ON rev_alloc_audit(company_id, created_at DESC, method);

CREATE INDEX rev_alloc_audit_corridor_alert_idx ON rev_alloc_audit(company_id, corridor_flag, created_at DESC) 
WHERE corridor_flag = true;

-- SSP change governance indexes
CREATE INDEX rev_ssp_change_workflow_idx ON rev_ssp_change(company_id, status, created_at DESC);

CREATE INDEX rev_ssp_change_pending_idx ON rev_ssp_change(company_id, status, created_at DESC) 
WHERE status IN ('DRAFT', 'REVIEWED');

-- Composite indexes for common query patterns
CREATE INDEX rev_ssp_catalog_company_product_currency_idx ON rev_ssp_catalog(company_id, product_id, currency);

CREATE INDEX rev_bundle_company_status_effective_idx ON rev_bundle(company_id, status, effective_from DESC);

CREATE INDEX rev_discount_applied_invoice_rule_idx ON rev_discount_applied(company_id, invoice_id, rule_id);
