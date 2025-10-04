-- M26.7: Attestations Portal - Assignments
-- Default assignees per scope

CREATE TABLE attest_assignment (         -- default assignees per scope
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES attest_program(id) ON DELETE CASCADE,
  scope_key TEXT NOT NULL,               -- PROCESS:*, PROCESS:R2R, ENTITY:MY, etc.
  assignee_id UUID NOT NULL,
  approver_id UUID,
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, program_id, scope_key, assignee_id)
);
