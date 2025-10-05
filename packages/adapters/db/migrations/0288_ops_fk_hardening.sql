-- M27.1: Real-Time Signals & Auto-Playbooks - Foreign Key Hardening
-- Migration: 0288_ops_fk_hardening.sql

-- Add foreign key constraints and cascades
ALTER TABLE ops_rule ADD CONSTRAINT fk_ops_rule_company 
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

ALTER TABLE ops_rule ADD CONSTRAINT fk_ops_rule_updated_by 
    FOREIGN KEY (updated_by) REFERENCES "user"(id) ON DELETE RESTRICT;

ALTER TABLE ops_playbook ADD CONSTRAINT fk_ops_playbook_company 
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

ALTER TABLE ops_playbook ADD CONSTRAINT fk_ops_playbook_created_by 
    FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE RESTRICT;

ALTER TABLE ops_playbook ADD CONSTRAINT fk_ops_playbook_updated_by 
    FOREIGN KEY (updated_by) REFERENCES "user"(id) ON DELETE RESTRICT;

ALTER TABLE ops_fire ADD CONSTRAINT fk_ops_fire_company 
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

ALTER TABLE ops_fire ADD CONSTRAINT fk_ops_fire_created_by 
    FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE RESTRICT;

ALTER TABLE ops_guardrail_lock ADD CONSTRAINT fk_ops_guardrail_lock_company 
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

ALTER TABLE ops_guardrail_lock ADD CONSTRAINT fk_ops_guardrail_lock_created_by 
    FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE RESTRICT;

ALTER TABLE ops_quorum_vote ADD CONSTRAINT fk_ops_quorum_vote_actor 
    FOREIGN KEY (actor_id) REFERENCES "user"(id) ON DELETE RESTRICT;

-- Add not-null constraints where appropriate
ALTER TABLE ops_rule ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE ops_rule ALTER COLUMN name SET NOT NULL;
ALTER TABLE ops_rule ALTER COLUMN when_expr SET NOT NULL;
ALTER TABLE ops_rule ALTER COLUMN threshold SET NOT NULL;
ALTER TABLE ops_rule ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE ops_playbook ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE ops_playbook ALTER COLUMN name SET NOT NULL;
ALTER TABLE ops_playbook ALTER COLUMN steps SET NOT NULL;
ALTER TABLE ops_playbook ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE ops_playbook ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE ops_fire ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE ops_fire ALTER COLUMN rule_id SET NOT NULL;
ALTER TABLE ops_fire ALTER COLUMN window_from SET NOT NULL;
ALTER TABLE ops_fire ALTER COLUMN window_to SET NOT NULL;
ALTER TABLE ops_fire ALTER COLUMN reason SET NOT NULL;
ALTER TABLE ops_fire ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE ops_fire_step ALTER COLUMN fire_id SET NOT NULL;
ALTER TABLE ops_fire_step ALTER COLUMN step_no SET NOT NULL;
ALTER TABLE ops_fire_step ALTER COLUMN action_code SET NOT NULL;

ALTER TABLE ops_guardrail_lock ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE ops_guardrail_lock ALTER COLUMN scope SET NOT NULL;
ALTER TABLE ops_guardrail_lock ALTER COLUMN key SET NOT NULL;
ALTER TABLE ops_guardrail_lock ALTER COLUMN until_ts SET NOT NULL;
ALTER TABLE ops_guardrail_lock ALTER COLUMN reason SET NOT NULL;
ALTER TABLE ops_guardrail_lock ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE ops_quorum_vote ALTER COLUMN fire_id SET NOT NULL;
ALTER TABLE ops_quorum_vote ALTER COLUMN actor_id SET NOT NULL;
ALTER TABLE ops_quorum_vote ALTER COLUMN decision SET NOT NULL;

-- Comments for documentation
COMMENT ON CONSTRAINT fk_ops_rule_company ON ops_rule IS 'Foreign key to company with cascade delete';
COMMENT ON CONSTRAINT fk_ops_rule_updated_by ON ops_rule IS 'Foreign key to user who last updated the rule';
COMMENT ON CONSTRAINT fk_ops_playbook_company ON ops_playbook IS 'Foreign key to company with cascade delete';
COMMENT ON CONSTRAINT fk_ops_fire_company ON ops_fire IS 'Foreign key to company with cascade delete';
COMMENT ON CONSTRAINT fk_ops_guardrail_lock_company ON ops_guardrail_lock IS 'Foreign key to company with cascade delete';
COMMENT ON CONSTRAINT fk_ops_quorum_vote_actor ON ops_quorum_vote IS 'Foreign key to user who cast the vote';
