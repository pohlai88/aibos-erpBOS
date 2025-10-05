-- M26.8: Auditor Workspace - Request Management
-- Migration: 0261_auditor_requests.sql

-- PBC / follow-up requests from auditors
CREATE TABLE audit_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  auditor_id UUID NOT NULL REFERENCES audit_auditor(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'OPEN',     -- OPEN|RESPONDED|CLOSED
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threaded Q&A & responses
CREATE TABLE audit_request_msg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES audit_request(id) ON DELETE CASCADE,
  author_kind TEXT NOT NULL,              -- AUDITOR|OWNER|SYSTEM
  author_id TEXT,                          -- null for SYSTEM
  body TEXT NOT NULL,
  evd_record_id TEXT,                      -- optional link to evidence
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX ON audit_request(company_id, auditor_id, state, due_at);
CREATE INDEX ON audit_request(auditor_id, state, created_at DESC);
CREATE INDEX ON audit_request_msg(request_id, created_at ASC);

-- Comments for documentation
COMMENT ON TABLE audit_request IS 'PBC and follow-up requests from external auditors';
COMMENT ON TABLE audit_request_msg IS 'Threaded messages and responses for audit requests';
