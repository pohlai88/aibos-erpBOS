-- 0012_multi_currency.sql
-- Company base currency
alter table company add column if not exists base_currency text not null default 'MYR';

-- FX rates (D=direct, I=inverted; we'll store direct as base)
create table if not exists fx_rate (
  id text primary key,
  date date not null,                -- effective date
  from_ccy text not null,
  to_ccy text not null,
  rate numeric(20,10) not null,      -- 1 from_ccy = rate to_ccy
  source text default 'manual',
  created_at timestamptz default now()
);
create index if not exists idx_fx_date_pair on fx_rate (date desc, from_ccy, to_ccy);

-- Journal & lines now carry base currency context
alter table journal
  add column if not exists base_currency text,
  add column if not exists rate_used numeric(20,10); -- optional, for explain/debug

alter table journal_line
  add column if not exists base_amount numeric(20,6), -- signed, in base currency
  add column if not exists base_currency text,
  add column if not exists txn_amount numeric(20,6),  -- existing 'amount' stays; normalize usage
  add column if not exists txn_currency text;

-- For realized FX P&L
-- (You likely already have P&L accounts. Ensure you have these codes.)
-- FX Gain: 'FX Gain'   (credit-positive)
-- FX Loss: 'FX Loss'   (debit-positive)
