-- M14.2: Dimension Assurance - GL Dimension Routes
-- Automatic dimension assignment based on account codes

create table if not exists gl_dimension_routes (
  id text primary key,
  company_id text not null,
  account_code text not null,
  cost_center_id text references dim_cost_center(id),
  project_id text references dim_project(id),
  priority integer not null default 100, -- lower = higher priority
  effective_from date not null default current_date,
  effective_to date, -- null = indefinite
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by text not null
);

-- Unique constraint: one active route per account per company
create unique index if not exists uq_gl_dimension_routes_active
on gl_dimension_routes(company_id, account_code)
where active = true and (effective_to is null or effective_to >= current_date);

-- Query accelerators
create index if not exists ix_gl_dimension_routes_company on gl_dimension_routes(company_id);
create index if not exists ix_gl_dimension_routes_account on gl_dimension_routes(account_code);
create index if not exists ix_gl_dimension_routes_priority on gl_dimension_routes(priority);

-- Add default operating cost center to company table
alter table company
add column if not exists default_operating_cc text references dim_cost_center(id);

-- Add default project to customer table (optional)
alter table customer
add column if not exists default_project_id text references dim_project(id);

-- Add default cost center to supplier table (optional)
alter table supplier
add column if not exists default_cost_center_id text references dim_cost_center(id);
