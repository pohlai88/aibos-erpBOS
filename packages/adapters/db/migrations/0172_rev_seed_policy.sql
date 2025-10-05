BEGIN;

-- Revenue Recognition Policy Seeding (M25.1)
-- Optional seeding of default recognition policies

-- This migration provides example policy seeding
-- In production, policies should be configured per company requirements

-- Example policy template (commented out - uncomment and modify as needed):
/*
INSERT INTO rev_policy (
    company_id, 
    rev_account, 
    unbilled_ar_account, 
    deferred_rev_account, 
    rounding, 
    updated_by
) VALUES (
    'default-company',           -- Replace with actual company ID
    '4000-REVENUE',             -- Revenue account
    '1205-UNBILLED-AR',         -- Unbilled AR account  
    '2205-DEFERRED-REVENUE',    -- Deferred revenue account
    'HALF_UP',                  -- Rounding method
    'system'                    -- Updated by
) ON CONFLICT (company_id) DO UPDATE SET
    rev_account = EXCLUDED.rev_account,
    unbilled_ar_account = EXCLUDED.unbilled_ar_account,
    deferred_rev_account = EXCLUDED.deferred_rev_account,
    rounding = EXCLUDED.rounding,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
*/

COMMIT;
