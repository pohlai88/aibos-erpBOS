-- M26: Close Policy Seeding
-- Seed baseline policy (materiality & SLA) per company

-- Insert default close policies for existing companies
-- This ensures all companies have baseline configuration
INSERT INTO close_policy (
    company_id,
    materiality_abs,
    materiality_pct,
    sla_default_hours,
    reminder_cadence_mins,
    tz,
    created_by,
    updated_by
)
SELECT 
    c.id as company_id,
    10000 as materiality_abs,
    0.02 as materiality_pct,
    72 as sla_default_hours,
    60 as reminder_cadence_mins,
    COALESCE(c.timezone, 'UTC') as tz,
    'system' as created_by,
    'system' as updated_by
FROM company c
WHERE NOT EXISTS (
    SELECT 1 FROM close_policy cp WHERE cp.company_id = c.id
)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default flux rules for existing companies
INSERT INTO flux_rule (
    id,
    company_id,
    scope,
    dim,
    threshold_abs,
    threshold_pct,
    require_comment,
    active,
    created_by,
    updated_by
)
SELECT 
    gen_random_uuid()::text as id,
    c.id as company_id,
    'PL' as scope,
    'ACCOUNT' as dim,
    5000 as threshold_abs,
    0.05 as threshold_pct,
    TRUE as require_comment,
    TRUE as active,
    'system' as created_by,
    'system' as updated_by
FROM company c
UNION ALL
SELECT 
    gen_random_uuid()::text as id,
    c.id as company_id,
    'BS' as scope,
    'ACCOUNT' as dim,
    10000 as threshold_abs,
    0.10 as threshold_pct,
    TRUE as require_comment,
    TRUE as active,
    'system' as created_by,
    'system' as updated_by
FROM company c
UNION ALL
SELECT 
    gen_random_uuid()::text as id,
    c.id as company_id,
    'CF' as scope,
    'ACCOUNT' as dim,
    5000 as threshold_abs,
    0.05 as threshold_pct,
    TRUE as require_comment,
    TRUE as active,
    'system' as created_by,
    'system' as updated_by
FROM company c;

-- Comments
COMMENT ON TABLE close_policy IS 'Seeded with default policies for all companies';
COMMENT ON TABLE flux_rule IS 'Seeded with default flux analysis rules for all companies';
