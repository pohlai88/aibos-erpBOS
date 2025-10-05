-- m14_1_budgets.sql

-- Budget header (optional grouping; CSV/source tracking)
create table if not exists budget (
  id text primary key,
  company_id text not null,
  name text not null,
  currency text not null,                -- use base currency for now
  locked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ix_budget_company on budget(company_id);

-- Budget line: monthly bucket (YYYY-MM), account, optional dimensions
create table if not exists budget_line (
  id text primary key,
  budget_id text not null references budget(id) on delete cascade,
  company_id text not null,
  period_month char(7) not null,         -- e.g. '2025-11'
  account_code text not null,
  cost_center_id text,                   -- fk optional: dim_cost_center(id)
  project_id text,                       -- fk optional: dim_project(id)
  amount_base numeric(20,6) not null,    -- positive for DR, negative for CR, or use natural sign convention
  created_at timestamptz not null default now()
);

-- one budget line per unique axis
create unique index if not exists uq_budget_line_axis
on budget_line(budget_id, period_month, account_code, coalesce(cost_center_id,''), coalesce(project_id,''));

-- Query accelerators
create index if not exists ix_bl_company_period on budget_line(company_id, period_month);
create index if not exists ix_bl_account on budget_line(account_code);
create index if not exists ix_bl_cc on budget_line(cost_center_id);
create index if not exists ix_bl_project on budget_line(project_id);
