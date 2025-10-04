-- M26.5: SOX 302/404 Pack - Deficiency Management
-- Deficiency Lifecycle and Tracking

CREATE TABLE sox_deficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  control_id UUID REFERENCES sox_key_control(id) ON DELETE SET NULL,
  discovered_in TEXT NOT NULL,           -- YYYYQn
  type TEXT NOT NULL,                    -- DESIGN|OPERATING
  severity TEXT NOT NULL,                -- INCONSEQUENTIAL|SIGNIFICANT|MATERIAL
  description TEXT NOT NULL,
  root_cause TEXT,
  aggregation_id UUID,                   -- for roll-up
  rem_owner_id UUID,
  remediation_plan TEXT,
  remediation_due DATE,
  status TEXT NOT NULL DEFAULT 'OPEN',   -- OPEN|IN_PROGRESS|VALIDATING|CLOSED
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sox_deficiency_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deficiency_id UUID NOT NULL REFERENCES sox_deficiency(id) ON DELETE CASCADE,
  source TEXT NOT NULL,                  -- TEST_RESULT|INCIDENT|AUDIT
  source_id TEXT NOT NULL,
  UNIQUE(deficiency_id, source, source_id)
);

-- Add foreign key constraints
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_rem_owner_id_fk 
  FOREIGN KEY (rem_owner_id) REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_created_by_fk 
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE RESTRICT;

-- Add check constraints
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_type_check 
  CHECK (type IN ('DESIGN', 'OPERATING'));
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_severity_check 
  CHECK (severity IN ('INCONSEQUENTIAL', 'SIGNIFICANT', 'MATERIAL'));
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_status_check 
  CHECK (status IN ('OPEN', 'IN_PROGRESS', 'VALIDATING', 'CLOSED'));
ALTER TABLE sox_deficiency_link ADD CONSTRAINT sox_deficiency_link_source_check 
  CHECK (source IN ('TEST_RESULT', 'INCIDENT', 'AUDIT'));
