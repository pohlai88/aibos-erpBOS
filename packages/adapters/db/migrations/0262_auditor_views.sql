-- M26.8: Auditor Workspace - Convenient Views
-- Migration: 0262_auditor_views.sql

-- Convenient join to resolved titles & hashes for attestation packs
CREATE VIEW v_audit_pack AS
SELECT 
  ap.id, 
  ap.task_id, 
  ap.sha256, 
  a.campaign_id, 
  t.assignee_id,
  ac.name as campaign_name,
  at.title as task_title
FROM attest_pack ap
JOIN attest_task t ON t.id = ap.task_id
JOIN attest_campaign a ON a.id = t.campaign_id
JOIN attest_campaign ac ON ac.id = a.id
JOIN attest_template at ON at.id = t.template_id;

-- View for control runs with metadata
CREATE VIEW v_audit_ctrl_run AS
SELECT 
  cr.id,
  cr.control_id,
  cr.run_id,
  cr.status,
  cr.result,
  cr.executed_at,
  cc.name as control_name,
  cc.domain,
  cc.severity
FROM ctrl_run cr
JOIN ctrl_control cc ON cc.id = cr.control_id;

-- View for evidence records with object metadata
CREATE VIEW v_audit_evidence AS
SELECT 
  er.id,
  er.object_id,
  er.source,
  er.source_id,
  er.title,
  er.note,
  er.tags,
  er.pii_level,
  er.created_at,
  eo.sha256_hex,
  eo.size_bytes,
  eo.mime
FROM evd_record er
JOIN evd_object eo ON eo.id = er.object_id;

-- Comments for documentation
COMMENT ON VIEW v_audit_pack IS 'Resolved attestation pack metadata for auditor grants';
COMMENT ON VIEW v_audit_ctrl_run IS 'Control run metadata with control details';
COMMENT ON VIEW v_audit_evidence IS 'Evidence records with object metadata for auditor access';
