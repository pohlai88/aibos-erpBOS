-- M26.1: Auto-Controls & Certifications - Core Controls Tables
-- Migration: 0200_controls_core.sql

-- Controls Library Table
CREATE TABLE ctrl_control (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    domain TEXT NOT NULL CHECK (domain IN ('CLOSE', 'AP', 'AR', 'REV', 'FX', 'BANK', 'INV', 'FIXEDASSET')),
    frequency TEXT NOT NULL CHECK (frequency IN ('PER_RUN', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    auto_kind TEXT NOT NULL CHECK (auto_kind IN ('NONE', 'SQL', 'SCRIPT', 'POLICY')),
    auto_config JSONB,
    evidence_required BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    
    -- Unique constraint per company
    UNIQUE(company_id, code)
);

-- Control Assignments Table
CREATE TABLE ctrl_assignment (
    id TEXT PRIMARY KEY,
    control_id TEXT NOT NULL REFERENCES ctrl_control(id) ON DELETE CASCADE,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES close_task(id) ON DELETE CASCADE,
    entity_id TEXT, -- For entity-specific controls
    owner TEXT NOT NULL,
    approver TEXT NOT NULL,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    
    -- Ensure at least one assignment target
    CHECK (
        (run_id IS NOT NULL) OR 
        (task_id IS NOT NULL) OR 
        (entity_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_ctrl_control_company_code ON ctrl_control(company_id, code);
CREATE INDEX idx_ctrl_control_domain_status ON ctrl_control(domain, status);
CREATE INDEX idx_ctrl_assignment_control_active ON ctrl_assignment(control_id, active);
CREATE INDEX idx_ctrl_assignment_run_active ON ctrl_assignment(run_id, active) WHERE run_id IS NOT NULL;
CREATE INDEX idx_ctrl_assignment_task_active ON ctrl_assignment(task_id, active) WHERE task_id IS NOT NULL;
CREATE INDEX idx_ctrl_assignment_sla_due ON ctrl_assignment(sla_due_at) WHERE active = true AND sla_due_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE ctrl_control IS 'Controls library defining automated tests and manual controls';
COMMENT ON TABLE ctrl_assignment IS 'Assignment of controls to close runs, tasks, or entities';
COMMENT ON COLUMN ctrl_control.domain IS 'Domain scope: CLOSE, AP, AR, REV, FX, BANK, INV, FIXEDASSET';
COMMENT ON COLUMN ctrl_control.frequency IS 'Execution frequency: PER_RUN, MONTHLY, QUARTERLY, ANNUAL, ADHOC';
COMMENT ON COLUMN ctrl_control.severity IS 'Control severity: LOW, MEDIUM, HIGH';
COMMENT ON COLUMN ctrl_control.auto_kind IS 'Automation type: NONE, SQL, SCRIPT, POLICY';
COMMENT ON COLUMN ctrl_control.auto_config IS 'Configuration for automated controls (SQL queries, script params, etc.)';
