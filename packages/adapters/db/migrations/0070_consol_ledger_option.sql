BEGIN;

-- Whether to post summary consolidation JEs into a designated entity
CREATE TABLE IF NOT EXISTS consol_ledger_option (
  company_id   TEXT NOT NULL PRIMARY KEY,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  ledger_entity TEXT,                   -- e.g., 'CONSOL'
  summary_account TEXT,                 -- single account or null; else multi-line
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL
);

COMMIT;
