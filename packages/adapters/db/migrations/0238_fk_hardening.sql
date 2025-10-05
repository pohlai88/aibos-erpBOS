-- M26.5: SOX 302/404 Pack - Foreign Key Hardening
-- Ensure cascades & restricts are consistent with M26.x references

-- Additional foreign key constraints for data integrity
ALTER TABLE sox_deficiency ADD CONSTRAINT sox_deficiency_aggregation_id_fk 
  FOREIGN KEY (aggregation_id) REFERENCES sox_deficiency(id) ON DELETE SET NULL;

-- Add row level security policies
ALTER TABLE sox_key_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_control_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_test_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_test_sample ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_test_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_deficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_deficiency_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE sox_assertion ENABLE ROW LEVEL SECURITY;

-- RLS policies for company isolation
CREATE POLICY sox_key_control_company_isolation ON sox_key_control
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY sox_control_scope_company_isolation ON sox_control_scope
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY sox_test_plan_company_isolation ON sox_test_plan
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY sox_test_sample_company_isolation ON sox_test_sample
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY sox_test_result_company_isolation ON sox_test_result
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY sox_deficiency_company_isolation ON sox_deficiency
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY sox_deficiency_link_company_isolation ON sox_deficiency_link
  FOR ALL TO authenticated
  USING (deficiency_id IN (
    SELECT id FROM sox_deficiency 
    WHERE company_id = current_setting('app.current_company_id')::UUID
  ));

CREATE POLICY sox_assertion_company_isolation ON sox_assertion
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);
