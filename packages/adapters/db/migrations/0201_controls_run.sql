-- M26.1: Auto-Controls & Certifications - Control Runs & Results
-- Migration: 0201_controls_run.sql

-- Control Runs Table
CREATE TABLE ctrl_run (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    control_id TEXT NOT NULL REFERENCES ctrl_control(id) ON DELETE CASCADE,
    assignment_id TEXT REFERENCES ctrl_assignment(id) ON DELETE CASCADE,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'PASS', 'FAIL', 'WAIVED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Control Results Table
CREATE TABLE ctrl_result (
    id TEXT PRIMARY KEY,
    ctrl_run_id TEXT NOT NULL REFERENCES ctrl_run(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WAIVED')),
    detail JSONB NOT NULL DEFAULT '{}',
    sample_count INTEGER NOT NULL DEFAULT 0,
    exceptions_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Control Exceptions Table
CREATE TABLE ctrl_exception (
    id TEXT PRIMARY KEY,
    ctrl_run_id TEXT NOT NULL REFERENCES ctrl_run(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    message TEXT NOT NULL,
    item_ref TEXT, -- Reference to specific item that failed (JE number, account, etc.)
    material BOOLEAN NOT NULL DEFAULT false,
    remediation_state TEXT NOT NULL DEFAULT 'OPEN' CHECK (remediation_state IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'WAIVED')),
    assignee TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_ctrl_run_company_status ON ctrl_run(company_id, status);
CREATE INDEX idx_ctrl_run_control_scheduled ON ctrl_run(control_id, scheduled_at);
CREATE INDEX idx_ctrl_run_assignment ON ctrl_run(assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX idx_ctrl_run_close_run ON ctrl_run(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX idx_ctrl_run_status_scheduled ON ctrl_run(status, scheduled_at) WHERE status IN ('QUEUED', 'RUNNING');

CREATE INDEX idx_ctrl_result_run_status ON ctrl_result(ctrl_run_id, status);
CREATE INDEX idx_ctrl_exception_run_state ON ctrl_exception(ctrl_run_id, remediation_state);
CREATE INDEX idx_ctrl_exception_material_state ON ctrl_exception(material, remediation_state);
CREATE INDEX idx_ctrl_exception_assignee_due ON ctrl_exception(assignee, due_at) WHERE assignee IS NOT NULL AND due_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE ctrl_run IS 'Individual control execution runs';
COMMENT ON TABLE ctrl_result IS 'Results of control runs with pass/fail status';
COMMENT ON TABLE ctrl_exception IS 'Exceptions found during control runs with remediation tracking';
COMMENT ON COLUMN ctrl_run.status IS 'Run status: QUEUED, RUNNING, PASS, FAIL, WAIVED';
COMMENT ON COLUMN ctrl_result.detail IS 'Detailed results and metadata from control execution';
COMMENT ON COLUMN ctrl_exception.material IS 'Whether the exception is material for financial reporting';
COMMENT ON COLUMN ctrl_exception.remediation_state IS 'Exception remediation state: OPEN, IN_PROGRESS, RESOLVED, WAIVED';
