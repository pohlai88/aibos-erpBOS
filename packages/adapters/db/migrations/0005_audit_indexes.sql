-- Journals by company/date, and lookup by id
create index if not exists idx_journal_company_date on journal (company_id, posting_date desc, id);

-- Lines by journal, and by party to filter receivables/payables activity
create index if not exists idx_jl_journal on journal_line (journal_id);
create index if not exists idx_jl_party on journal_line (party_type, party_id);

-- Outbox events by time/topic
create index if not exists idx_outbox_time on outbox (created_at desc, id);
create index if not exists idx_outbox_topic_time on outbox (topic, created_at desc);
