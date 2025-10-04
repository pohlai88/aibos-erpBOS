-- M26.8: Auditor Workspace - Watermark Policy
-- Migration: 0267_auditor_watermark_policy.sql

-- Watermark policy configuration per company
CREATE TABLE audit_watermark_policy (
  company_id TEXT PRIMARY KEY,
  text_template TEXT NOT NULL DEFAULT 'CONFIDENTIAL • {company} • {auditor_email} • {ts}',
  diagonal BOOLEAN NOT NULL DEFAULT true,
  opacity NUMERIC NOT NULL DEFAULT 0.15,
  font_size NUMERIC NOT NULL DEFAULT 24,
  font_color TEXT NOT NULL DEFAULT '#FF0000',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE audit_watermark_policy ADD CONSTRAINT fk_audit_watermark_policy_created_by 
  FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE RESTRICT;

ALTER TABLE audit_watermark_policy ADD CONSTRAINT fk_audit_watermark_policy_updated_by 
  FOREIGN KEY (updated_by) REFERENCES user_account(id) ON DELETE RESTRICT;

-- Add check constraints
ALTER TABLE audit_watermark_policy ADD CONSTRAINT chk_audit_watermark_policy_opacity 
  CHECK (opacity >= 0 AND opacity <= 1);

ALTER TABLE audit_watermark_policy ADD CONSTRAINT chk_audit_watermark_policy_font_size 
  CHECK (font_size > 0 AND font_size <= 72);

-- Comments for documentation
COMMENT ON TABLE audit_watermark_policy IS 'Watermark policy configuration for auditor workspace previews';
COMMENT ON COLUMN audit_watermark_policy.text_template IS 'Template for watermark text with placeholders';
COMMENT ON COLUMN audit_watermark_policy.diagonal IS 'Whether to apply diagonal watermark';
COMMENT ON COLUMN audit_watermark_policy.opacity IS 'Watermark opacity (0-1)';
COMMENT ON COLUMN audit_watermark_policy.font_size IS 'Watermark font size in points';
COMMENT ON COLUMN audit_watermark_policy.font_color IS 'Watermark font color in hex';
