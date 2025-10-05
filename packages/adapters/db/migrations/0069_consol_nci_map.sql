BEGIN;

-- NCI (minority interest) mapping
CREATE TABLE IF NOT EXISTS consol_nci_map (
  company_id TEXT NOT NULL PRIMARY KEY,
  nci_equity_account TEXT NOT NULL,     -- balance sheet
  nci_ni_account     TEXT NOT NULL,     -- P&L allocation
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);

COMMIT;
