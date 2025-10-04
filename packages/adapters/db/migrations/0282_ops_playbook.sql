-- M27.1: Real-Time Signals & Auto-Playbooks - Playbook Tables
-- Migration: 0282_ops_playbook.sql

-- Playbook definitions
CREATE TABLE ops_playbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    steps JSONB NOT NULL,                  -- ordered steps configuration
    max_blast_radius INTEGER NOT NULL DEFAULT 100, -- max entities affected
    dry_run_default BOOLEAN NOT NULL DEFAULT true,
    require_dual_control BOOLEAN NOT NULL DEFAULT false,
    timeout_sec INTEGER NOT NULL DEFAULT 300, -- execution timeout
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CHECK (max_blast_radius > 0),
    CHECK (timeout_sec > 0)
);

-- Action registry for available actions
CREATE TABLE ops_action_registry (
    code TEXT PRIMARY KEY,                  -- AR.DUNNING.RUN, AP.PAYRUN.RESEQUENCE, etc
    description TEXT NOT NULL,
    caps_required TEXT[] NOT NULL DEFAULT '{}', -- required capabilities
    dry_run_supported BOOLEAN NOT NULL DEFAULT true,
    payload_schema JSONB NOT NULL DEFAULT '{}', -- Zod-like schema
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ops_playbook_company ON ops_playbook(company_id);
CREATE INDEX idx_ops_action_registry_enabled ON ops_action_registry(enabled);

-- Comments for documentation
COMMENT ON TABLE ops_playbook IS 'Action playbooks for automated responses';
COMMENT ON COLUMN ops_playbook.steps IS 'Ordered steps with action_code, payload, when, retry, on_error';
COMMENT ON COLUMN ops_playbook.max_blast_radius IS 'Maximum entities that can be affected';
COMMENT ON COLUMN ops_playbook.dry_run_default IS 'Default to dry-run mode for safety';
COMMENT ON COLUMN ops_playbook.require_dual_control IS 'Require dual approval before execution';
COMMENT ON TABLE ops_action_registry IS 'Registry of available actions with schemas and capabilities';
COMMENT ON COLUMN ops_action_registry.caps_required IS 'Required capabilities for action execution';
COMMENT ON COLUMN ops_action_registry.payload_schema IS 'Zod-like schema for payload validation';
