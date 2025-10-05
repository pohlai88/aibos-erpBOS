BEGIN;

-- Where to DR/CR when moving costs. Usually keep same natural account.
CREATE TABLE IF NOT EXISTS alloc_account_map (
  company_id    TEXT NOT NULL,
  src_account   TEXT NOT NULL,            -- from this PL account (e.g., 7400)
  target_account TEXT NOT NULL,           -- often same as src_account
  PRIMARY KEY (company_id, src_account)
);

COMMIT;
