BEGIN;

CREATE TABLE IF NOT EXISTS consol_account_map (
  company_id TEXT NOT NULL,
  purpose    TEXT NOT NULL,        -- 'IC_ELIM','CTA','MINORITY'
  account    TEXT NOT NULL,
  PRIMARY KEY (company_id, purpose)
);

COMMIT;
