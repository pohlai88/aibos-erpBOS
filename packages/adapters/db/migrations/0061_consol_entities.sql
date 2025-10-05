BEGIN;

CREATE TABLE IF NOT EXISTS co_entity (
  company_id  TEXT NOT NULL,           -- tenant
  entity_code TEXT NOT NULL,           -- e.g. "SG-CO", "MY-CO"
  name        TEXT NOT NULL,
  base_ccy    TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (company_id, entity_code)
);

CREATE TABLE IF NOT EXISTS co_group (
  company_id  TEXT NOT NULL,
  group_code  TEXT NOT NULL,           -- e.g. "APAC-GRP"
  name        TEXT NOT NULL,
  presentation_ccy TEXT NOT NULL,
  PRIMARY KEY (company_id, group_code)
);

-- Ownership matrix (direct holding %; effective window)
CREATE TABLE IF NOT EXISTS co_ownership (
  company_id   TEXT NOT NULL,
  group_code   TEXT NOT NULL,
  parent_code  TEXT NOT NULL,
  child_code   TEXT NOT NULL,
  pct          NUMERIC NOT NULL,       -- 0..1
  eff_from     DATE NOT NULL,
  eff_to       DATE,
  PRIMARY KEY (company_id, group_code, parent_code, child_code, eff_from)
);

COMMIT;
