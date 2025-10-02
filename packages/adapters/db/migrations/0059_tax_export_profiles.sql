BEGIN;

CREATE TABLE IF NOT EXISTS tax_export_profile (
  company_id   TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  version      TEXT NOT NULL,
  format       TEXT NOT NULL,         -- 'MY-SST-02-CSV', 'UK-VAT100-XML'
  is_default   BOOLEAN NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (company_id, partner_code, version, format)
);

-- Optional single default per (partner,version)
CREATE UNIQUE INDEX IF NOT EXISTS tax_export_profile_default_uk
ON tax_export_profile(company_id, partner_code, version)
WHERE is_default = true;

COMMIT;
