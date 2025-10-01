alter table api_key add column if not exists scopes jsonb default '[]'::jsonb;
create index if not exists idx_api_key_user_company on api_key (user_id, company_id);
