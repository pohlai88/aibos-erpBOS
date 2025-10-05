-- M27.2: Foreign key hardening and triggers for Playbook Studio
-- Ensures referential integrity and audit trail consistency

-- Foreign key constraints
ALTER TABLE ops_playbook_version ADD CONSTRAINT fk_ops_playbook_version_playbook 
    FOREIGN KEY (playbook_id) REFERENCES ops_playbook(id) ON DELETE CASCADE;

ALTER TABLE ops_rule_version ADD CONSTRAINT fk_ops_rule_version_rule 
    FOREIGN KEY (rule_id) REFERENCES ops_rule(id) ON DELETE CASCADE;

ALTER TABLE ops_rule_version ADD CONSTRAINT fk_ops_rule_version_action_playbook 
    FOREIGN KEY (action_playbook_id) REFERENCES ops_playbook(id) ON DELETE SET NULL;

ALTER TABLE ops_dry_run_execution ADD CONSTRAINT fk_ops_dry_run_execution_playbook 
    FOREIGN KEY (playbook_id) REFERENCES ops_playbook(id) ON DELETE CASCADE;

ALTER TABLE ops_canary_execution ADD CONSTRAINT fk_ops_canary_execution_fire 
    FOREIGN KEY (fire_id) REFERENCES ops_fire(id) ON DELETE CASCADE;

ALTER TABLE ops_canary_execution ADD CONSTRAINT fk_ops_canary_execution_playbook 
    FOREIGN KEY (playbook_id) REFERENCES ops_playbook(id) ON DELETE CASCADE;

ALTER TABLE ops_approval_request ADD CONSTRAINT fk_ops_approval_request_fire 
    FOREIGN KEY (fire_id) REFERENCES ops_fire(id) ON DELETE CASCADE;

ALTER TABLE ops_approval_request ADD CONSTRAINT fk_ops_approval_request_playbook 
    FOREIGN KEY (playbook_id) REFERENCES ops_playbook(id) ON DELETE CASCADE;

ALTER TABLE ops_action_verification ADD CONSTRAINT fk_ops_action_verification_fire 
    FOREIGN KEY (fire_id) REFERENCES ops_fire(id) ON DELETE CASCADE;

ALTER TABLE ops_execution_metrics ADD CONSTRAINT fk_ops_execution_metrics_playbook 
    FOREIGN KEY (playbook_id) REFERENCES ops_playbook(id) ON DELETE CASCADE;

ALTER TABLE ops_blast_radius_log ADD CONSTRAINT fk_ops_blast_radius_log_fire 
    FOREIGN KEY (fire_id) REFERENCES ops_fire(id) ON DELETE CASCADE;

ALTER TABLE ops_blast_radius_log ADD CONSTRAINT fk_ops_blast_radius_log_playbook 
    FOREIGN KEY (playbook_id) REFERENCES ops_playbook(id) ON DELETE CASCADE;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ops_playbook_version_updated_at 
    BEFORE UPDATE ON ops_playbook_version 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ops_rule_version_updated_at 
    BEFORE UPDATE ON ops_rule_version 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ops_canary_execution_updated_at 
    BEFORE UPDATE ON ops_canary_execution 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ops_approval_request_updated_at 
    BEFORE UPDATE ON ops_approval_request 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ops_execution_metrics_updated_at 
    BEFORE UPDATE ON ops_execution_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to ensure only one active version per playbook/rule
CREATE OR REPLACE FUNCTION ensure_single_active_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_active = true, deactivate all other versions
    IF NEW.is_active = true THEN
        IF TG_TABLE_NAME = 'ops_playbook_version' THEN
            UPDATE ops_playbook_version 
            SET is_active = false 
            WHERE playbook_id = NEW.playbook_id 
            AND id != NEW.id;
        ELSIF TG_TABLE_NAME = 'ops_rule_version' THEN
            UPDATE ops_rule_version 
            SET is_active = false 
            WHERE rule_id = NEW.rule_id 
            AND id != NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_active_playbook_version 
    BEFORE INSERT OR UPDATE ON ops_playbook_version 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_active_version();

CREATE TRIGGER ensure_single_active_rule_version 
    BEFORE INSERT OR UPDATE ON ops_rule_version 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_active_version();

-- Trigger to auto-expire approval requests
CREATE OR REPLACE FUNCTION expire_approval_requests()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ops_approval_request 
    SET status = 'EXPIRED' 
    WHERE expires_at < NOW() 
    AND status = 'PENDING';
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create a function to be called periodically to expire requests
CREATE OR REPLACE FUNCTION cleanup_expired_approvals()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE ops_approval_request 
    SET status = 'EXPIRED' 
    WHERE expires_at < NOW() 
    AND status = 'PENDING';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Comments
COMMENT ON FUNCTION ensure_single_active_version() IS 'Ensures only one active version per playbook/rule';
COMMENT ON FUNCTION cleanup_expired_approvals() IS 'Cleans up expired approval requests';
COMMENT ON FUNCTION update_updated_at_column() IS 'Updates the updated_at timestamp on row changes';
