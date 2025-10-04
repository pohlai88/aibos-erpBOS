-- M27.1: Real-Time Signals & Auto-Playbooks - Guardrails Tables
-- Migration: 0284_ops_guardrails.sql

-- Guardrail locks for blast-radius, backoff, and per-entity protection
CREATE TABLE ops_guardrail_lock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    scope TEXT NOT NULL,                   -- RULE|ACTION|ENTITY|GLOBAL
    key TEXT NOT NULL,                     -- lock identifier
    until_ts TIMESTAMPTZ NOT NULL,        -- lock expiration
    reason TEXT NOT NULL,                 -- why locked
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint per scope/key
    UNIQUE(company_id, scope, key)
);

-- Quorum voting for dual control approvals
CREATE TABLE ops_quorum_vote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fire_id UUID NOT NULL REFERENCES ops_fire(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,                -- user/system that voted
    decision TEXT NOT NULL CHECK (decision IN ('APPROVE', 'REJECT')),
    reason TEXT,                          -- optional reason
    at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint per fire/actor
    UNIQUE(fire_id, actor_id)
);

-- Indexes for performance
CREATE INDEX idx_ops_guardrail_lock_company_scope ON ops_guardrail_lock(company_id, scope);
CREATE INDEX idx_ops_guardrail_lock_until_ts ON ops_guardrail_lock(until_ts);
CREATE INDEX idx_ops_quorum_vote_fire ON ops_quorum_vote(fire_id);
CREATE INDEX idx_ops_quorum_vote_actor ON ops_quorum_vote(actor_id);

-- Comments for documentation
COMMENT ON TABLE ops_guardrail_lock IS 'Safety locks for blast-radius, backoff, and entity protection';
COMMENT ON COLUMN ops_guardrail_lock.scope IS 'Lock scope: RULE, ACTION, ENTITY, GLOBAL';
COMMENT ON COLUMN ops_guardrail_lock.key IS 'Lock identifier within scope';
COMMENT ON COLUMN ops_guardrail_lock.until_ts IS 'Lock expiration timestamp';
COMMENT ON TABLE ops_quorum_vote IS 'Dual control voting for fire approvals';
COMMENT ON COLUMN ops_quorum_vote.decision IS 'Vote decision: APPROVE or REJECT';
COMMENT ON COLUMN ops_quorum_vote.actor_id IS 'User or system that cast the vote';
