-- 0011_webhooks.sql
create table if not exists webhook (
  id text primary key,
  company_id text not null,
  url text not null,
  secret text not null,              -- HMAC secret (random base64url)
  topics text[] not null,            -- e.g. {"JournalPosted","JournalReversed"}
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  disabled_at timestamptz,
  rotated_at timestamptz
);

create index if not exists idx_webhook_company on webhook(company_id);

create table if not exists webhook_attempt (
  id text primary key,               -- delivery id (uuid)
  webhook_id text not null,
  event_id text not null,            -- outbox.id (or synthetic replay id)
  topic text not null,
  payload jsonb not null,
  status text not null,              -- "pending" | "success" | "failed" | "dead"
  try_count int not null default 0,
  next_try_at timestamptz not null default now(),
  last_error text,
  response_status int,
  response_ms int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attempt_next on webhook_attempt(next_try_at asc, status asc);
create index if not exists idx_attempt_webhook on webhook_attempt(webhook_id);
