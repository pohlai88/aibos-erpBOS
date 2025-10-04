-- M26.5: SOX 302/404 Pack - Performance Indexes
-- Optimize queries for dashboards and reporting

CREATE INDEX idx_sox_key_control_company_process ON sox_key_control(company_id, process);
CREATE INDEX idx_sox_key_control_company_owner ON sox_key_control(company_id, owner_id);
CREATE INDEX idx_sox_key_control_company_active ON sox_key_control(company_id, active);

CREATE INDEX idx_sox_control_scope_company_period ON sox_control_scope(company_id, period);
CREATE INDEX idx_sox_control_scope_control_period ON sox_control_scope(control_id, period);

CREATE INDEX idx_sox_test_plan_company_period ON sox_test_plan(company_id, period);
CREATE INDEX idx_sox_test_plan_control_period ON sox_test_plan(control_id, period);
CREATE INDEX idx_sox_test_plan_status ON sox_test_plan(status, prepared_at);

CREATE INDEX idx_sox_test_sample_plan ON sox_test_sample(plan_id);
CREATE INDEX idx_sox_test_sample_company ON sox_test_sample(company_id);

CREATE INDEX idx_sox_test_result_company_plan ON sox_test_result(company_id, plan_id);
CREATE INDEX idx_sox_test_result_plan_tested_at ON sox_test_result(plan_id, tested_at DESC);
CREATE INDEX idx_sox_test_result_outcome ON sox_test_result(outcome, tested_at);
CREATE INDEX idx_sox_test_result_evd_record ON sox_test_result(evd_record_id);

CREATE INDEX idx_sox_deficiency_company_status ON sox_deficiency(company_id, status);
CREATE INDEX idx_sox_deficiency_company_severity ON sox_deficiency(company_id, severity);
CREATE INDEX idx_sox_deficiency_status_severity ON sox_deficiency(status, severity);
CREATE INDEX idx_sox_deficiency_discovered_in ON sox_deficiency(discovered_in);
CREATE INDEX idx_sox_deficiency_control ON sox_deficiency(control_id);
CREATE INDEX idx_sox_deficiency_rem_owner ON sox_deficiency(rem_owner_id);
CREATE INDEX idx_sox_deficiency_created_at ON sox_deficiency(created_at);

CREATE INDEX idx_sox_deficiency_link_deficiency ON sox_deficiency_link(deficiency_id);
CREATE INDEX idx_sox_deficiency_link_source ON sox_deficiency_link(source, source_id);

CREATE INDEX idx_sox_assertion_company_type ON sox_assertion(company_id, type);
CREATE INDEX idx_sox_assertion_company_period ON sox_assertion(company_id, period);
CREATE INDEX idx_sox_assertion_type_period ON sox_assertion(type, period);
CREATE INDEX idx_sox_assertion_signed_by ON sox_assertion(signed_by);
CREATE INDEX idx_sox_assertion_signed_at ON sox_assertion(signed_at);
