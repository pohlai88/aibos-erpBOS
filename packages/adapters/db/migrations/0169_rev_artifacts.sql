BEGIN;

-- Revenue Recognition Artifacts (M25.1)
-- Export artifacts for audit and compliance

CREATE TABLE rev_artifact (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES rev_rec_run(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('CSV','JSON')),
  filename TEXT NOT NULL,
  sha256 TEXT NOT NULL,                             -- file integrity hash
  bytes INTEGER NOT NULL,                           -- file size in bytes
  storage_uri TEXT NOT NULL,                        -- storage location URI
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX rev_artifact_run_idx ON rev_artifact(run_id);
CREATE INDEX rev_artifact_kind_idx ON rev_artifact(kind, created_at);

COMMIT;
