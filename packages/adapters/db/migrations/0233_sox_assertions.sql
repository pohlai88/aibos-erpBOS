-- M26.5: SOX 302/404 Pack - Management Assertions
-- 302/404 Executive Sign-offs

CREATE TABLE sox_assertion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  period TEXT NOT NULL,                  -- YYYYQn or YYYY
  type TEXT NOT NULL,                    -- 302|404
  statement JSONB NOT NULL,              -- declarative payload
  ebinder_id UUID,                       -- link M26.4 binder
  signed_by UUID NOT NULL,
  signed_role TEXT NOT NULL,             -- CEO|CFO|CONTROLLER
  sha256_hex TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, type, period, signed_by)
);

-- Add foreign key constraints
ALTER TABLE sox_assertion ADD CONSTRAINT sox_assertion_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE sox_assertion ADD CONSTRAINT sox_assertion_ebinder_id_fk 
  FOREIGN KEY (ebinder_id) REFERENCES evd_binder(id) ON DELETE SET NULL;
ALTER TABLE sox_assertion ADD CONSTRAINT sox_assertion_signed_by_fk 
  FOREIGN KEY (signed_by) REFERENCES "user"(id) ON DELETE RESTRICT;

-- Add check constraints
ALTER TABLE sox_assertion ADD CONSTRAINT sox_assertion_type_check 
  CHECK (type IN ('302', '404'));
ALTER TABLE sox_assertion ADD CONSTRAINT sox_assertion_signed_role_check 
  CHECK (signed_role IN ('CEO', 'CFO', 'CONTROLLER', 'OTHER'));
