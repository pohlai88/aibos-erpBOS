-- M25.3: Discount Rules and Application Tables
-- Discount rule definitions and application tracking

CREATE TABLE rev_discount_rule (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('PROP', 'RESIDUAL', 'TIERED', 'PROMO', 'PARTNER')),
    code TEXT NOT NULL,
    name TEXT,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    priority INTEGER DEFAULT 0 CHECK (priority >= 0),
    max_usage_count INTEGER,
    max_usage_amount NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

CREATE TABLE rev_discount_applied (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    rule_id TEXT NOT NULL REFERENCES rev_discount_rule(id),
    computed_amount NUMERIC(15,2) NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_discount_rule_company_code_idx ON rev_discount_rule(company_id, code, effective_from DESC);
CREATE INDEX rev_discount_rule_active_idx ON rev_discount_rule(company_id, active, effective_from);
CREATE INDEX rev_discount_rule_kind_idx ON rev_discount_rule(company_id, kind, priority);
CREATE INDEX rev_discount_applied_invoice_idx ON rev_discount_applied(company_id, invoice_id);
CREATE INDEX rev_discount_applied_rule_idx ON rev_discount_applied(company_id, rule_id);

-- Unique constraint for active discount code per company
CREATE UNIQUE INDEX rev_discount_rule_unique_active ON rev_discount_rule(company_id, code, effective_from) 
WHERE active = true AND effective_to IS NULL;

-- Comments for documentation
COMMENT ON TABLE rev_discount_rule IS 'Discount rule definitions with various types and parameters';
COMMENT ON COLUMN rev_discount_rule.kind IS 'Discount type: PROP (proportional), RESIDUAL (to residual-eligible), TIERED (volume/term), PROMO (promotional), PARTNER (partner program)';
COMMENT ON COLUMN rev_discount_rule.code IS 'Discount code identifier';
COMMENT ON COLUMN rev_discount_rule.params IS 'JSON parameters specific to discount kind (e.g., percentage, thresholds, windows)';
COMMENT ON COLUMN rev_discount_rule.priority IS 'Application priority (higher numbers apply first)';
COMMENT ON COLUMN rev_discount_rule.max_usage_count IS 'Maximum number of times this rule can be applied';
COMMENT ON COLUMN rev_discount_rule.max_usage_amount IS 'Maximum total discount amount across all applications';

COMMENT ON TABLE rev_discount_applied IS 'Tracking of discount rule applications to invoices';
COMMENT ON COLUMN rev_discount_applied.computed_amount IS 'Actual discount amount computed and applied';
COMMENT ON COLUMN rev_discount_applied.detail IS 'JSON details of the application (line items affected, calculations, etc.)';
