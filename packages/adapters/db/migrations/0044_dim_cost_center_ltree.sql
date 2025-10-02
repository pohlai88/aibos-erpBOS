BEGIN;

CREATE EXTENSION IF NOT EXISTS ltree;

ALTER TABLE dim_cost_center
  ADD COLUMN IF NOT EXISTS path LTREE;

-- Backfill path using parent_id relationships; path segments use 'code'
WITH RECURSIVE cc AS (
  SELECT id, parent_id, code, code::ltree AS path
  FROM dim_cost_center
  WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.parent_id, c.code, (cc.path || c.code::ltree)::ltree
  FROM dim_cost_center c
  JOIN cc ON c.parent_id = cc.id
)
UPDATE dim_cost_center d
SET path = cc.path
FROM cc
WHERE d.id = cc.id;

CREATE INDEX IF NOT EXISTS dim_cost_center_path_gist
  ON dim_cost_center USING GIST (path);

CREATE OR REPLACE FUNCTION dim_cost_center_path_maintain() RETURNS trigger AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := NEW.code::ltree;
  ELSE
    SELECT (p.path || NEW.code::ltree)::ltree INTO NEW.path
    FROM dim_cost_center p WHERE p.id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dim_cc_path ON dim_cost_center;
CREATE TRIGGER trg_dim_cc_path
BEFORE INSERT OR UPDATE OF parent_id, code
ON dim_cost_center
FOR EACH ROW EXECUTE FUNCTION dim_cost_center_path_maintain();

COMMIT;