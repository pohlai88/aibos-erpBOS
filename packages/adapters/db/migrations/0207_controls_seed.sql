-- M26.1: Auto-Controls & Certifications - Seed Baseline Controls
-- Migration: 0207_controls_seed.sql

-- Seed baseline controls for common financial controls
-- Note: These will be inserted for each company when they first set up controls

-- Function to seed controls for a company
CREATE OR REPLACE FUNCTION seed_baseline_controls(p_company_id TEXT, p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert baseline controls if they don't exist
    INSERT INTO ctrl_control (id, company_id, code, name, purpose, domain, frequency, severity, auto_kind, auto_config, evidence_required, created_by, updated_by)
    VALUES
    -- Journal Entry Controls
    (p_company_id || '_JE_CONTINUITY', p_company_id, 'JE_CONTINUITY', 'Journal Entry Continuity', 
     'Ensure no gaps in journal entry sequence numbers for open periods', 'CLOSE', 'PER_RUN', 'HIGH', 'SQL',
     '{"query": "SELECT COUNT(*) as gap_count FROM (SELECT seq, LAG(seq) OVER (ORDER BY seq) as prev_seq FROM journal_entries WHERE company_id = $1 AND period_year = $2 AND period_month = $3) gaps WHERE seq - prev_seq > 1"}',
     true, p_user_id, p_user_id),
    
    -- Subledger Tie-out Controls
    (p_company_id || '_SUBLEDGER_TIEOUT_AP', p_company_id, 'SUBLEDGER_TIEOUT_AP', 'AP Subledger Tie-out',
     'Reconcile AP subledger balances to GL control accounts', 'AP', 'PER_RUN', 'HIGH', 'SQL',
     '{"query": "SELECT account_code, subledger_balance, gl_balance, ABS(subledger_balance - gl_balance) as variance FROM ap_subledger_summary WHERE company_id = $1 AND period_year = $2 AND period_month = $3", "materiality_threshold": 1000}',
     true, p_user_id, p_user_id),
    
    (p_company_id || '_SUBLEDGER_TIEOUT_AR', p_company_id, 'SUBLEDGER_TIEOUT_AR', 'AR Subledger Tie-out',
     'Reconcile AR subledger balances to GL control accounts', 'AR', 'PER_RUN', 'HIGH', 'SQL',
     '{"query": "SELECT account_code, subledger_balance, gl_balance, ABS(subledger_balance - gl_balance) as variance FROM ar_subledger_summary WHERE company_id = $1 AND period_year = $2 AND period_month = $3", "materiality_threshold": 1000}',
     true, p_user_id, p_user_id),
    
    (p_company_id || '_SUBLEDGER_TIEOUT_REV', p_company_id, 'SUBLEDGER_TIEOUT_REV', 'Revenue Subledger Tie-out',
     'Reconcile revenue subledger balances to GL control accounts', 'REV', 'PER_RUN', 'HIGH', 'SQL',
     '{"query": "SELECT account_code, subledger_balance, gl_balance, ABS(subledger_balance - gl_balance) as variance FROM rev_subledger_summary WHERE company_id = $1 AND period_year = $2 AND period_month = $3", "materiality_threshold": 1000}',
     true, p_user_id, p_user_id),
    
    -- Bank Reconciliation Controls
    (p_company_id || '_BANK_RECON_DIFF', p_company_id, 'BANK_RECON_DIFF', 'Bank Reconciliation Differences',
     'Identify material differences between bank statements and GL cash accounts', 'BANK', 'PER_RUN', 'HIGH', 'SQL',
     '{"query": "SELECT bank_account, statement_balance, gl_balance, ABS(statement_balance - gl_balance) as variance FROM bank_reconciliation WHERE company_id = $1 AND period_year = $2 AND period_month = $3", "materiality_threshold": 500}',
     true, p_user_id, p_user_id),
    
    -- FX Controls
    (p_company_id || '_FX_REVAL_LOCK', p_company_id, 'FX_REVAL_LOCK', 'FX Revaluation Lock',
     'Ensure FX revaluation snapshots are present and revaluation is posted once', 'FX', 'PER_RUN', 'MEDIUM', 'SCRIPT',
     '{"script": "fxRevalLock", "check_snapshots": true, "check_posted_once": true}',
     true, p_user_id, p_user_id),
    
    -- Revenue Controls
    (p_company_id || '_REVENUE_RPO_ROLLFWD', p_company_id, 'REVENUE_RPO_ROLLFWD', 'Revenue RPO Roll-forward',
     'Verify RPO opening + bookings - recognition - modifications = closing balance', 'REV', 'PER_RUN', 'HIGH', 'SCRIPT',
     '{"script": "rpoRollforward", "tolerance": 0.01}',
     true, p_user_id, p_user_id),
    
    -- Flux Analysis Controls
    (p_company_id || '_FLUX_COMMENTS_REQUIRED', p_company_id, 'FLUX_COMMENTS_REQUIRED', 'Flux Comments Required',
     'Ensure material flux variances have explanatory comments', 'CLOSE', 'PER_RUN', 'MEDIUM', 'SQL',
     '{"query": "SELECT account_code, variance_amount, comment FROM flux_analysis WHERE company_id = $1 AND period_year = $2 AND period_month = $3 AND ABS(variance_amount) > $4 AND (comment IS NULL OR comment = '')", "materiality_threshold": 10000}',
     false, p_user_id, p_user_id),
    
    -- Cash Flow Controls
    (p_company_id || '_CASHFLOW_BRIDGE', p_company_id, 'CASHFLOW_BRIDGE', 'Cash Flow Bridge',
     'Reconcile indirect vs direct cash flow methods', 'CLOSE', 'PER_RUN', 'MEDIUM', 'SCRIPT',
     '{"script": "cashflowBridge", "tolerance": 100}',
     true, p_user_id, p_user_id)
    
    ON CONFLICT (company_id, code) DO NOTHING;
    
    -- Insert baseline certification statements
    INSERT INTO cert_statement (id, company_id, code, text, level, created_by, updated_by)
    VALUES
    (p_company_id || '_MANAGER_STD', p_company_id, 'MANAGER_STD', 
     'I certify that the financial statements for the period are accurate and complete to the best of my knowledge and belief.',
     'ENTITY', p_user_id, p_user_id),
    
    (p_company_id || '_CONTROLLER_STD', p_company_id, 'CONTROLLER_STD',
     'I certify that the financial statements have been prepared in accordance with applicable accounting standards and that all material controls have been tested and are operating effectively.',
     'ENTITY', p_user_id, p_user_id),
    
    (p_company_id || '_CFO_STD', p_company_id, 'CFO_STD',
     'I certify that the consolidated financial statements present fairly, in all material respects, the financial position and results of operations of the company.',
     'CONSOLIDATED', p_user_id, p_user_id)
    
    ON CONFLICT (company_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION seed_baseline_controls IS 'Seeds baseline controls and certification statements for a company';
