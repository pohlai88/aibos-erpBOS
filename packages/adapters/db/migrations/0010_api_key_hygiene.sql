-- 0010_api_key_hygiene.sql
alter table api_key
  add column if not exists prefix text default 'ak'::text,
  add column if not exists last_used_at timestamptz,
  add column if not exists rotated_at timestamptz,
  add column if not exists created_by_key_id text;

create index if not exists idx_api_key_last_used on api_key (last_used_at desc);
