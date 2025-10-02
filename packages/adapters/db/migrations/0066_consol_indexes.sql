BEGIN;
CREATE INDEX IF NOT EXISTS ic_link_entity_idx
  ON ic_link(company_id, entity_code, co_entity_cp);
CREATE INDEX IF NOT EXISTS co_ownership_eff_idx
  ON co_ownership(company_id, group_code, parent_code, child_code, eff_from);
COMMIT;
