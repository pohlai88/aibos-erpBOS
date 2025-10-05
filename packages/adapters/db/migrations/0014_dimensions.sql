-- m14_dimensions.sql

-- 1) Master tables for dimensions
create table if not exists dim_cost_center (
  id text primary key,              -- e.g. "CC-OPS"
  name text not null,
  parent_id text references dim_cost_center(id), -- optional hierarchy
  active boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_dim_cc_active on dim_cost_center(active);

create table if not exists dim_project (
  id text primary key,              -- e.g. "PRJ-ALPHA"
  name text not null,
  active boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_dim_project_active on dim_project(active);

-- 2) Account policies (which dimensions are required/optional)
alter table account
  add column if not exists require_cost_center boolean not null default false,
  add column if not exists require_project boolean not null default false;

-- 3) Journal lines carry dims (NULLABLE; enforced by policy)
alter table journal_line
  add column if not exists cost_center_id text references dim_cost_center(id),
  add column if not exists project_id text references dim_project(id);

-- Indexes for performance
create index if not exists idx_jl_cost_center on journal_line(cost_center_id);
create index if not exists idx_jl_project on journal_line(project_id);
