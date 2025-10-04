-- M26.4 Enhanced Evidence Vault - Performance Indexes
-- Migration: 0225_evd_perf_idx.sql

-- Additional performance indexes for the enhanced evidence system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_record_company_source ON evd_record(company_id, source, source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_link_company_kind_ref ON evd_link(company_id, kind, ref_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_manifest_company_scope ON evd_manifest(company_id, scope_kind, scope_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_binder_company_scope ON evd_binder(company_id, scope_kind, scope_id, built_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_record_pii_tags ON evd_record(company_id, pii_level, tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_manifest_filters ON evd_manifest(company_id, filters);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evd_binder_format ON evd_binder(company_id, format, built_at DESC);

-- Comments for documentation
COMMENT ON INDEX idx_evd_record_company_source IS 'Fast lookup of evidence by company and source context';
COMMENT ON INDEX idx_evd_link_company_kind_ref IS 'Fast lookup of evidence links by business object';
COMMENT ON INDEX idx_evd_manifest_company_scope IS 'Fast lookup of manifests by scope and creation time';
COMMENT ON INDEX idx_evd_binder_company_scope IS 'Fast lookup of binders by scope and build time';
