-- M26: Close Orchestrator Core Tables
-- Period-aware close runs, checklists, owners, dependencies, SLAs, evidence trail, approvals, and entity/period locks

-- Close Run Management
CREATE TABLE close_run (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ABORTED')),
    started_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    owner TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    UNIQUE(company_id, year, month)
);

-- Close Task Management
CREATE TABLE close_task (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES close_run(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'BLOCKED', 'READY', 'DONE', 'REJECTED')),
    priority INTEGER DEFAULT 0,
    tags TEXT[],
    evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
    approver TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    UNIQUE(run_id, code)
);

-- Task Dependencies
CREATE TABLE close_dep (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES close_run(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL REFERENCES close_task(id) ON DELETE CASCADE,
    depends_on_task_id TEXT NOT NULL REFERENCES close_task(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- Evidence Management
CREATE TABLE close_evidence (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES close_run(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL REFERENCES close_task(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('LINK', 'FILE', 'NOTE')),
    uri_or_note TEXT NOT NULL,
    added_by TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Close Policy Configuration
CREATE TABLE close_policy (
    company_id TEXT PRIMARY KEY,
    materiality_abs NUMERIC NOT NULL DEFAULT 10000,
    materiality_pct NUMERIC NOT NULL DEFAULT 0.02,
    sla_default_hours INTEGER NOT NULL DEFAULT 72,
    reminder_cadence_mins INTEGER NOT NULL DEFAULT 60,
    tz TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Entity/Period Locks
CREATE TABLE close_lock (
    company_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (company_id, entity_id, year, month)
);

-- Indexes for performance
CREATE INDEX close_run_company_period_idx ON close_run(company_id, year, month);
CREATE INDEX close_run_status_idx ON close_run(company_id, status, started_at);
CREATE INDEX close_task_run_status_idx ON close_task(run_id, status);
CREATE INDEX close_task_sla_idx ON close_task(status, sla_due_at);
CREATE INDEX close_task_owner_idx ON close_task(owner, status);
CREATE INDEX close_evidence_task_idx ON close_evidence(task_id);
CREATE INDEX close_evidence_run_idx ON close_evidence(run_id);
CREATE INDEX close_dep_task_idx ON close_dep(task_id);
CREATE INDEX close_dep_depends_idx ON close_dep(depends_on_task_id);
CREATE INDEX close_lock_period_idx ON close_lock(company_id, year, month);

-- Comments for documentation
COMMENT ON TABLE close_run IS 'Close run management with period-aware orchestration';
COMMENT ON TABLE close_task IS 'Individual close tasks with SLA tracking and evidence requirements';
COMMENT ON TABLE close_dep IS 'Task dependency management for close orchestration';
COMMENT ON TABLE close_evidence IS 'Evidence trail for close tasks (links, files, notes)';
COMMENT ON TABLE close_policy IS 'Company-specific close policy configuration';
COMMENT ON TABLE close_lock IS 'Entity/period locks to prevent concurrent close operations';
