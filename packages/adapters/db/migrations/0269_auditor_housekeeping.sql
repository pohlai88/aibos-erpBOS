-- M26.8: Auditor Workspace - Housekeeping
-- Migration: 0269_auditor_housekeeping.sql

-- Create a function to clean up expired auditor data
CREATE OR REPLACE FUNCTION audit_housekeeping()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM audit_session WHERE expires_at < now();
  
  -- Delete expired download keys
  DELETE FROM audit_dl_key WHERE expires_at < now();
  
  -- Delete expired grants (soft delete by updating status)
  UPDATE audit_grant SET expires_at = now() WHERE expires_at < now() AND expires_at > now() - interval '1 day';
  
  -- Log housekeeping activity
  INSERT INTO audit_access_log (company_id, auditor_id, scope, object_id, action, meta)
  VALUES ('SYSTEM', '00000000-0000-0000-0000-000000000000', 'REPORT', 'housekeeping', 'SYSTEM', 
          jsonb_build_object('cleaned_sessions', (SELECT count(*) FROM audit_session WHERE expires_at < now()),
                           'cleaned_keys', (SELECT count(*) FROM audit_dl_key WHERE expires_at < now()),
                           'cleaned_grants', (SELECT count(*) FROM audit_grant WHERE expires_at < now())));
END;
$$ LANGUAGE plpgsql;

-- Create a function to send reminder notifications
CREATE OR REPLACE FUNCTION audit_send_reminders()
RETURNS void AS $$
BEGIN
  -- Send reminders for grants expiring in 24 hours
  INSERT INTO outbox (company_id, event_type_id, aggregate_id, aggregate_type, event_data, created_at)
  SELECT 
    ag.company_id,
    'audit_grant_expired',
    ag.id,
    'audit_grant',
    jsonb_build_object(
      'auditor_id', ag.auditor_id,
      'scope', ag.scope,
      'object_id', ag.object_id,
      'expires_at', ag.expires_at
    ),
    now()
  FROM audit_grant ag
  WHERE ag.expires_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
    AND ag.expires_at > now();
    
  -- Send reminders for overdue PBC requests
  INSERT INTO outbox (company_id, event_type_id, aggregate_id, aggregate_type, event_data, created_at)
  SELECT 
    ar.company_id,
    'audit_pbc_opened',
    ar.id,
    'audit_request',
    jsonb_build_object(
      'auditor_id', ar.auditor_id,
      'title', ar.title,
      'due_at', ar.due_at,
      'overdue_hours', EXTRACT(EPOCH FROM (now() - ar.due_at)) / 3600
    ),
    now()
  FROM audit_request ar
  WHERE ar.state = 'OPEN' 
    AND ar.due_at < now() - interval '1 hour'
    AND ar.due_at > now() - interval '25 hours';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION audit_housekeeping() IS 'Cleans up expired auditor sessions, keys, and grants';
COMMENT ON FUNCTION audit_send_reminders() IS 'Sends reminders for expiring grants and overdue PBC requests';
