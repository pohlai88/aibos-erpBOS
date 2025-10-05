-- M28.5: Subleases & Sale-and-Leaseback (MFRS 16) - Seed Templates
-- Migration: 0325_seed_templates.sql

-- Seed default journal templates for finance sublease postings
INSERT INTO gl_journal_template (id, company_id, template_name, description, module, created_at, created_by) VALUES
    ('sublease_finance_init', 'default', 'Finance Sublease Initial Recognition', 'Initial recognition of finance sublease (Dr NIS / Cr ROU)', 'lease', NOW(), 'system'),
    ('sublease_finance_monthly', 'default', 'Finance Sublease Monthly Posting', 'Monthly finance sublease posting (Dr NIS / Cr Interest Income)', 'lease', NOW(), 'system'),
    ('sublease_operating_monthly', 'default', 'Operating Sublease Monthly Posting', 'Monthly operating sublease posting (Dr Cash/A/R / Cr Lease Income)', 'lease', NOW(), 'system'),
    ('slb_initial', 'default', 'SLB Initial Posting', 'Initial SLB posting (Dr Cash, ROU / Cr Asset, Liability, Gains)', 'lease', NOW(), 'system'),
    ('slb_monthly', 'default', 'SLB Monthly Posting', 'Monthly SLB posting (interest, ROU amortization, deferred gain unwind)', 'lease', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Seed template lines for finance sublease initial recognition
INSERT INTO gl_journal_template_line (id, template_id, line_order, account_code, dr_cr, amount_formula, description, created_at, created_by) VALUES
    ('sublease_finance_init_1', 'sublease_finance_init', 1, 'NIS', 'DR', 'PV(receipts)', 'Net investment in sublease', NOW(), 'system'),
    ('sublease_finance_init_2', 'sublease_finance_init', 2, 'ROU', 'CR', 'PV(receipts)', 'Right-of-use asset (portion transferred)', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Seed template lines for finance sublease monthly posting
INSERT INTO gl_journal_template_line (id, template_id, line_order, account_code, dr_cr, amount_formula, description, created_at, created_by) VALUES
    ('sublease_finance_monthly_1', 'sublease_finance_monthly', 1, 'NIS', 'DR', 'cash_receipt', 'Net investment in sublease (receipt)', NOW(), 'system'),
    ('sublease_finance_monthly_2', 'sublease_finance_monthly', 2, 'INTEREST_INCOME', 'CR', 'interest', 'Interest income', NOW(), 'system'),
    ('sublease_finance_monthly_3', 'sublease_finance_monthly', 3, 'NIS', 'CR', 'principal', 'Net investment in sublease (principal)', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Seed template lines for operating sublease monthly posting
INSERT INTO gl_journal_template_line (id, template_id, line_order, account_code, dr_cr, amount_formula, description, created_at, created_by) VALUES
    ('sublease_operating_monthly_1', 'sublease_operating_monthly', 1, 'CASH', 'DR', 'receipt', 'Cash received', NOW(), 'system'),
    ('sublease_operating_monthly_2', 'sublease_operating_monthly', 2, 'LEASE_INCOME', 'CR', 'income', 'Lease income', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Seed template lines for SLB initial posting
INSERT INTO gl_journal_template_line (id, template_id, line_order, account_code, dr_cr, amount_formula, description, created_at, created_by) VALUES
    ('slb_initial_1', 'slb_initial', 1, 'CASH', 'DR', 'sale_price', 'Cash received', NOW(), 'system'),
    ('slb_initial_2', 'slb_initial', 2, 'ROU', 'DR', 'rou_retained', 'Right-of-use asset (retained)', NOW(), 'system'),
    ('slb_initial_3', 'slb_initial', 3, 'PPE', 'CR', 'CA', 'Property, plant and equipment', NOW(), 'system'),
    ('slb_initial_4', 'slb_initial', 4, 'LEASE_LIABILITY', 'CR', 'LB_PV', 'Lease liability (leaseback PV)', NOW(), 'system'),
    ('slb_initial_5', 'slb_initial', 5, 'GAIN_DISPOSAL', 'CR', 'gain_rec', 'Gain on disposal (recognized)', NOW(), 'system'),
    ('slb_initial_6', 'slb_initial', 6, 'DEFERRED_GAIN', 'CR', 'gain_def', 'Deferred gain (liability)', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;

-- Seed template lines for SLB monthly posting
INSERT INTO gl_journal_template_line (id, template_id, line_order, account_code, dr_cr, amount_formula, description, created_at, created_by) VALUES
    ('slb_monthly_1', 'slb_monthly', 1, 'INTEREST_EXPENSE', 'DR', 'interest', 'Interest expense on leaseback', NOW(), 'system'),
    ('slb_monthly_2', 'slb_monthly', 2, 'LEASE_LIABILITY', 'DR', 'principal', 'Lease liability (principal)', NOW(), 'system'),
    ('slb_monthly_3', 'slb_monthly', 3, 'CASH', 'CR', 'payment', 'Cash paid', NOW(), 'system'),
    ('slb_monthly_4', 'slb_monthly', 4, 'ROU_AMORTIZATION', 'DR', 'amort', 'ROU amortization expense', NOW(), 'system'),
    ('slb_monthly_5', 'slb_monthly', 5, 'ROU', 'CR', 'amort', 'Right-of-use asset', NOW(), 'system'),
    ('slb_monthly_6', 'slb_monthly', 6, 'DEFERRED_GAIN', 'DR', 'unwind', 'Deferred gain unwind', NOW(), 'system'),
    ('slb_monthly_7', 'slb_monthly', 7, 'GAIN_DISPOSAL', 'CR', 'unwind', 'Gain on disposal (unwind)', NOW(), 'system')
ON CONFLICT (id) DO NOTHING;
