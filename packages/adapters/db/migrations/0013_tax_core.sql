-- m13_tax_core.sql

-- Tax Code: label + behavior
create table if not exists tax_code (
  id text primary key,                -- e.g. "SR", "ZR", "EXEMPT"
  name text not null,                 -- human friendly
  kind text not null check (kind in ('output','input','both')), -- applicability hint
  rate numeric(9,6) not null default 0,  -- default rate (0..1), e.g., 0.06
  rounding text not null default 'half_up', -- 'half_up' | 'bankers'
  precision int not null default 2,
  created_at timestamptz not null default now()
);

-- Rules per company with date range (you can have changes over time)
create table if not exists tax_rule (
  id text primary key,
  company_id text not null,
  tax_code_id text not null references tax_code(id),
  effective_from date not null,
  effective_to date, -- null = open
  override_rate numeric(9,6),   -- optional override for this rule
  jurisdiction text,            -- future use
  created_at timestamptz not null default now()
);
create index if not exists idx_tax_rule_company ON tax_rule(company_id, effective_from desc);

-- Map codes to GL accounts for posting (per company)
create table if not exists tax_account_map (
  company_id text not null,
  tax_code_id text not null references tax_code(id),
  output_account_code text, -- e.g. "Output Tax"
  input_account_code text,  -- e.g. "Input Tax"
  primary key (company_id, tax_code_id)
);

-- Optional: tag items or accounts (minimal for V1)
create table if not exists tax_group (
  id text primary key,        -- e.g., "STD", "ZERO"
  name text not null
);
alter table item add column if not exists tax_group_id text;            -- if you have items table
alter table account add column if not exists default_tax_code_id text;  -- for services/expense accounts
