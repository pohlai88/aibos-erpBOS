-- M25.3: SSP Policy Configuration
-- Company-level SSP policy settings and defaults

CREATE TABLE rev_ssp_policy (
    company_id TEXT PRIMARY KEY,
    rounding TEXT NOT NULL DEFAULT 'HALF_UP' CHECK (rounding IN ('HALF_UP', 'BANKERS')),
    residual_allowed BOOLEAN NOT NULL DEFAULT true,
    residual_eligible_products JSONB DEFAULT '[]'::jsonb,
    default_method TEXT NOT NULL DEFAULT 'OBSERVABLE' CHECK (default_method IN ('OBSERVABLE', 'BENCHMARK', 'ADJ_COST', 'RESIDUAL')),
    corridor_tolerance_pct NUMERIC(5,4) DEFAULT 0.20 CHECK (corridor_tolerance_pct >= 0 AND corridor_tolerance_pct <= 1),
    alert_threshold_pct NUMERIC(5,4) DEFAULT 0.15 CHECK (alert_threshold_pct >= 0 AND alert_threshold_pct <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Comments for documentation
COMMENT ON TABLE rev_ssp_policy IS 'Company-level SSP policy configuration and defaults';
COMMENT ON COLUMN rev_ssp_policy.rounding IS 'Rounding method for SSP calculations';
COMMENT ON COLUMN rev_ssp_policy.residual_allowed IS 'Whether residual method is allowed for this company';
COMMENT ON COLUMN rev_ssp_policy.residual_eligible_products IS 'JSON array of product IDs eligible for residual method';
COMMENT ON COLUMN rev_ssp_policy.default_method IS 'Default SSP determination method for new entries';
COMMENT ON COLUMN rev_ssp_policy.corridor_tolerance_pct IS 'Default corridor tolerance percentage';
COMMENT ON COLUMN rev_ssp_policy.alert_threshold_pct IS 'Threshold for triggering corridor breach alerts';
