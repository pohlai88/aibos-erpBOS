-- M14.2: Dimension Assurance - Backfill Script
-- One-time backfill to assign dimensions to existing journal lines

-- 1) Set default operating cost center for COMP-1
update company 
set default_operating_cc = 'CC-OPS'
where id = 'COMP-1' and default_operating_cc is null;

-- 2) Create dimension routes for common accounts
insert into gl_dimension_routes (id, company_id, account_code, cost_center_id, project_id, priority, created_by)
values 
  ('ROUTE-SALES', 'COMP-1', 'Sales', 'CC-OPS', null, 10, 'system'),
  ('ROUTE-COGS', 'COMP-1', 'COGS', 'CC-OPS', null, 10, 'system'),
  ('ROUTE-EXPENSE', 'COMP-1', 'Expense', 'CC-OPS', null, 10, 'system'),
  ('ROUTE-AR', 'COMP-1', 'Trade Receivables', 'CC-OPS', null, 10, 'system'),
  ('ROUTE-AP', 'COMP-1', 'Trade Payables', 'CC-OPS', null, 10, 'system'),
  ('ROUTE-BANK', 'COMP-1', 'Bank', 'CC-OPS', null, 10, 'system'),
  ('ROUTE-INV', 'COMP-1', 'Inventory', 'CC-OPS', null, 10, 'system')
on conflict (id) do nothing;

-- 3) Backfill journal lines with cost center based on routes
update journal_line jl
set cost_center_id = r.cost_center_id
from gl_dimension_routes r
join journal j on j.id = jl.journal_id
where r.company_id = j.company_id
  and r.account_code = jl.account_code
  and r.active = true
  and (r.effective_to is null or r.effective_to >= j.posting_date)
  and jl.cost_center_id is null;

-- 4) Backfill remaining journal lines with company default
update journal_line jl
set cost_center_id = c.default_operating_cc
from journal j
join company c on c.id = j.company_id
where j.id = jl.journal_id
  and jl.cost_center_id is null
  and c.default_operating_cc is not null;

-- 5) Verify backfill results
select 
  'Backfill Results' as status,
  count(*) as total_lines,
  count(cost_center_id) as lines_with_cc,
  count(project_id) as lines_with_project
from journal_line jl
join journal j on j.id = jl.journal_id
where j.company_id = 'COMP-1';
