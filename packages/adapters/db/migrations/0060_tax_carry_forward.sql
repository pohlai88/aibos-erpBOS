BEGIN;

CREATE TABLE IF NOT EXISTS tax_carry_forward (
  id             TEXT PRIMARY KEY,
  company_id     TEXT NOT NULL,
  partner_code   TEXT NOT NULL,
  from_year      INT NOT NULL,
  from_month     INT NOT NULL,
  into_year      INT NOT NULL,
  into_month     INT NOT NULL,
  source_ref     TEXT NOT NULL,      -- invoice/journal id
  box_id         TEXT NOT NULL,      -- mapped box in the original (from) period
  amount         NUMERIC NOT NULL,   -- +/- in base
  reason         TEXT,               -- 'LATE_POSTING'|'ROUNDING'|...
  status         TEXT NOT NULL CHECK (status IN ('proposed','accepted','rejected','applied')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  created_by     TEXT NOT NULL
);

-- Idempotency: a source_ref can be proposed once per from-period
CREATE UNIQUE INDEX IF NOT EXISTS tax_carry_forward_uk
ON tax_carry_forward(company_id, partner_code, from_year, from_month, source_ref);

COMMIT;
