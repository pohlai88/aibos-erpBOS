BEGIN;
-- lock eliminations by rule+period to enforce idempotency per rule category
CREATE TABLE IF NOT EXISTS ic_elim_rule_lock (
  company_id TEXT NOT NULL,
  group_code TEXT NOT NULL,
  year       INT NOT NULL,
  month      INT NOT NULL,
  rule_code  TEXT NOT NULL,
  PRIMARY KEY (company_id, group_code, year, month, rule_code)
);
COMMIT;
