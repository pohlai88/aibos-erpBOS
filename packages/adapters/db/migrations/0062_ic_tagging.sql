BEGIN;

-- Tag transactional lines (AR/AP/JE) with counterparty entity + external ref
CREATE TABLE IF NOT EXISTS ic_link (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  entity_code  TEXT NOT NULL,          -- this entity
  co_entity_cp TEXT NOT NULL,          -- counterparty entity
  source_type  TEXT NOT NULL,          -- 'AR','AP','JE'
  source_id    TEXT NOT NULL,          -- invoice/journal id
  ext_ref      TEXT,                   -- optional reference to match CP side
  amount_base  NUMERIC NOT NULL,       -- signed base amount (this entity base)
  posted_at    timestamptz NOT NULL DEFAULT now()
);

-- Matching table: pairs or groups of links that should eliminate
CREATE TABLE IF NOT EXISTS ic_match (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL,
  group_code   TEXT NOT NULL,
  year         INT NOT NULL,
  month        INT NOT NULL,
  tolerance    NUMERIC NOT NULL DEFAULT 0.01,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ic_match_line (
  id        TEXT PRIMARY KEY,
  match_id  TEXT NOT NULL REFERENCES ic_match(id) ON DELETE CASCADE,
  ic_link_id TEXT NOT NULL REFERENCES ic_link(id) ON DELETE RESTRICT
);

COMMIT;
