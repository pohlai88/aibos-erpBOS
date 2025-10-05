-- M26.7: Attestations Portal - Core Tables
-- Quarterly 302/annual 404 sub-certifications with immutable attest packs and escalation

CREATE TABLE attest_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  code TEXT NOT NULL,                    -- e.g., 302-Q4-FY25
  name TEXT NOT NULL,
  freq TEXT NOT NULL,                    -- QUARTERLY|ANNUAL|ADHOC
  scope TEXT[] NOT NULL DEFAULT '{}',    -- processes/entities in scope
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE attest_template (           -- questionnaire template
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  code TEXT NOT NULL,                    -- e.g., 302-v1
  title TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  schema JSONB NOT NULL,                 -- Zod-like structure / question defs
  requires_evidence BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|RETIRED
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code, version)
);

CREATE TABLE attest_campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES attest_program(id) ON DELETE RESTRICT,
  template_id UUID NOT NULL REFERENCES attest_template(id) ON DELETE RESTRICT,
  period TEXT NOT NULL,                  -- YYYY-Qn or YYYY
  due_at TIMESTAMPTZ NOT NULL,
  state TEXT NOT NULL DEFAULT 'DRAFT',   -- DRAFT|ISSUED|CLOSED|ARCHIVED
  meta JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, program_id, period)
);

CREATE TYPE attest_task_state AS ENUM ('OPEN','IN_PROGRESS','SUBMITTED','RETURNED','APPROVED','REVOKED');

CREATE TABLE attest_task (               -- one per assignee in a campaign
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES attest_campaign(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL,             -- user
  scope_key TEXT NOT NULL,               -- e.g., PROCESS:R2R or ENTITY:MY
  state attest_task_state NOT NULL DEFAULT 'OPEN',
  due_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approver_id UUID,
  sla_state TEXT NOT NULL DEFAULT 'OK',  -- OK|DUE_SOON|LATE|ESCALATED (M26.6)
  created_by UUID NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, campaign_id, assignee_id, scope_key)
);

CREATE TABLE attest_response (           -- answers + exceptions
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES attest_task(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,                -- keyed by question id
  exceptions JSONB NOT NULL DEFAULT '[]',-- array of {qId, type, note}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attest_evidence_link (      -- tie to M26.4 evidence records
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES attest_task(id) ON DELETE CASCADE,
  evd_record_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, evd_record_id)
);

CREATE TABLE attest_pack (               -- immutable final pack
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES attest_task(id) ON DELETE CASCADE,
  manifest JSONB NOT NULL,               -- files, answers, signers
  sha256 TEXT NOT NULL,                  -- content-addressed hash
  signer_id UUID NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
