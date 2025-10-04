-- M26.5: SOX 302/404 Pack - Core Tables
-- Key Control Register and Scope Management

CREATE TABLE sox_key_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  process TEXT NOT NULL,                -- e.g., R2R, O2C, P2P, ITGC
  risk_stmt TEXT NOT NULL,              -- risk statement
  assertion TEXT NOT NULL,              -- e.g., E/O, C/O, V/A, P/D
  frequency TEXT NOT NULL,              -- DAILY|WEEKLY|MONTHLY|QUARTERLY|ADHOC
  automation TEXT NOT NULL,             -- MANUAL|IT_DEP|AUTOMATED
  owner_id UUID NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE sox_control_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  control_id UUID NOT NULL REFERENCES sox_key_control(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                 -- YYYYQn or YYYY-MM
  in_scope BOOLEAN NOT NULL DEFAULT true,
  materiality NUMERIC(18,2),            -- optional threshold for sampling
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (control_id, period)
);

-- Add foreign key constraints
ALTER TABLE sox_key_control ADD CONSTRAINT sox_key_control_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE sox_key_control ADD CONSTRAINT sox_key_control_owner_id_fk 
  FOREIGN KEY (owner_id) REFERENCES "user"(id) ON DELETE RESTRICT;
ALTER TABLE sox_key_control ADD CONSTRAINT sox_key_control_created_by_fk 
  FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE RESTRICT;

ALTER TABLE sox_control_scope ADD CONSTRAINT sox_control_scope_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE sox_control_scope ADD CONSTRAINT sox_control_scope_updated_by_fk 
  FOREIGN KEY (updated_by) REFERENCES "user"(id) ON DELETE RESTRICT;

-- Add check constraints
ALTER TABLE sox_key_control ADD CONSTRAINT sox_key_control_frequency_check 
  CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ADHOC'));
ALTER TABLE sox_key_control ADD CONSTRAINT sox_key_control_automation_check 
  CHECK (automation IN ('MANUAL', 'IT_DEP', 'AUTOMATED'));
ALTER TABLE sox_key_control ADD CONSTRAINT sox_key_control_assertion_check 
  CHECK (assertion IN ('E/O', 'C/O', 'V/A', 'P/D', 'OTHER'));
