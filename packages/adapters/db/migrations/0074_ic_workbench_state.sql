BEGIN;

-- Operator decisions on proposals
CREATE TABLE IF NOT EXISTS ic_workbench_decision (
  id          TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES ic_match_proposal(id) ON DELETE CASCADE,
  decided_by  TEXT NOT NULL,
  decision    TEXT NOT NULL CHECK (decision IN ('accept','reject','split')),
  reason      TEXT,
  decided_at  timestamptz NOT NULL DEFAULT now()
);
COMMIT;
