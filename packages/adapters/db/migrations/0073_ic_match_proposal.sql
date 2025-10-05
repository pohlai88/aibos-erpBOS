BEGIN;

-- Auto-generated candidate groups
CREATE TABLE IF NOT EXISTS ic_match_proposal (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  group_code  TEXT NOT NULL,
  year        INT NOT NULL,
  month       INT NOT NULL,
  score       NUMERIC NOT NULL,       -- 0..1 confidence
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ic_match_proposal_line (
  id           TEXT PRIMARY KEY,
  proposal_id  TEXT NOT NULL REFERENCES ic_match_proposal(id) ON DELETE CASCADE,
  ic_link_id   TEXT NOT NULL,
  hint         TEXT                   -- e.g., 'amount_match', 'ext_ref', 'date_nearby'
);

COMMIT;
