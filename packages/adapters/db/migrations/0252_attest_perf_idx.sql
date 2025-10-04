-- M26.7: Attestations Portal - Performance Indexes

CREATE INDEX ON attest_task(company_id, campaign_id, state, sla_state);
CREATE INDEX ON attest_task(company_id, assignee_id, state);
CREATE INDEX ON attest_campaign(company_id, state, due_at);
CREATE INDEX ON attest_pack(task_id);
CREATE INDEX ON attest_response(task_id);
CREATE INDEX ON attest_evidence_link(task_id);
CREATE INDEX ON attest_assignment(company_id, program_id, scope_key);
