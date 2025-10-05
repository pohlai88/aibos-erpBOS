-- M26.5: SOX 302/404 Pack - Testing Tables
-- Test Planning, Sampling, and Results

CREATE TABLE sox_test_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  control_id UUID NOT NULL REFERENCES sox_key_control(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                 -- YYYYQn
  attributes JSONB NOT NULL,            -- list of attributes to test
  sample_method TEXT NOT NULL,          -- RANDOM|JUDGMENTAL|ALL
  sample_size INT NOT NULL,
  prepared_by UUID NOT NULL,
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID, 
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT|APPROVED|LOCKED
  UNIQUE(control_id, period)
);

CREATE TABLE sox_test_sample (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES sox_test_plan(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,                     -- sampled item reference
  picked_reason TEXT,
  UNIQUE(plan_id, ref)
);

CREATE TABLE sox_test_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES sox_test_plan(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES sox_test_sample(id) ON DELETE SET NULL,
  attribute TEXT NOT NULL,
  outcome TEXT NOT NULL,                 -- PASS|FAIL|N/A
  note TEXT,
  evd_record_id UUID,                    -- link to M26.4 evd_record
  tested_by UUID NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE sox_test_plan ADD CONSTRAINT sox_test_plan_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE sox_test_plan ADD CONSTRAINT sox_test_plan_prepared_by_fk 
  FOREIGN KEY (prepared_by) REFERENCES "user"(id) ON DELETE RESTRICT;
ALTER TABLE sox_test_plan ADD CONSTRAINT sox_test_plan_approved_by_fk 
  FOREIGN KEY (approved_by) REFERENCES "user"(id) ON DELETE SET NULL;

ALTER TABLE sox_test_sample ADD CONSTRAINT sox_test_sample_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;

ALTER TABLE sox_test_result ADD CONSTRAINT sox_test_result_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE sox_test_result ADD CONSTRAINT sox_test_result_evd_record_id_fk 
  FOREIGN KEY (evd_record_id) REFERENCES evd_record(id) ON DELETE SET NULL;
ALTER TABLE sox_test_result ADD CONSTRAINT sox_test_result_tested_by_fk 
  FOREIGN KEY (tested_by) REFERENCES "user"(id) ON DELETE RESTRICT;

-- Add check constraints
ALTER TABLE sox_test_plan ADD CONSTRAINT sox_test_plan_sample_method_check 
  CHECK (sample_method IN ('RANDOM', 'JUDGMENTAL', 'ALL'));
ALTER TABLE sox_test_plan ADD CONSTRAINT sox_test_plan_status_check 
  CHECK (status IN ('DRAFT', 'APPROVED', 'LOCKED'));
ALTER TABLE sox_test_result ADD CONSTRAINT sox_test_result_outcome_check 
  CHECK (outcome IN ('PASS', 'FAIL', 'N/A'));
